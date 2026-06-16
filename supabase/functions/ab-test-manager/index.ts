// Supabase Edge Function: A/B Test Manager
// Endpoints:
//   POST   { action: "create",      test: ABTest }                  -> { test }
//   POST   { action: "get",         id: string }                    -> { test, stats }
//   POST   { action: "list" }                                        -> { tests: ABTest[] }
//   POST   { action: "assign",       id, user_id }                  -> { variant }
//   POST   { action: "track",        id, user_id, variant_id, event } -> { ok }
//   POST   { action: "update",       id, patch: Partial<ABTest> }   -> { test }
//   POST   { action: "delete",       id }                           -> { ok }
//   POST   { action: "stats",        id }                           -> { stats, timeSeries }
//
// Storage: Deno KV (persistent). If KV not available, uses in-memory map.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

interface Variant {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  weight: number;
}

interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Variant[];
  trafficSplit: number[];
  metrics: string[];
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  variantId: string;
  userId: string;
  event: string;
  ts: number;
  timeOnPage?: number;
}

const KV_TEST_KEY = (id: string) => ["ab_test", id];
const KV_LIST_KEY = ["ab_test_list"];
const KV_EVENTS_KEY = (testId: string) => ["ab_events", testId];

async function getKv() {
  try {
    // @ts-expect-error - Deno KV global available in Supabase Edge Functions
    return await Deno.openKv();
  } catch {
    return null;
  }
}

// In-memory fallback
const memTests = new Map<string, ABTest>();
const memEvents = new Map<string, Event[]>();
const ADMIN_ACTIONS = new Set(["create", "update", "delete", "list", "stats"]);

async function listTests(kv: Deno.Kv | null): Promise<ABTest[]> {
  if (kv) {
    const list: ABTest[] = [];
    for await (const entry of kv.list({ prefix: ["ab_test"] })) {
      list.push(entry.value as ABTest);
    }
    return list;
  }
  return Array.from(memTests.values());
}

async function getTest(kv: Deno.Kv | null, id: string): Promise<ABTest | null> {
  if (kv) {
    const r = await kv.get(KV_TEST_KEY(id));
    return (r.value as ABTest) ?? null;
  }
  return memTests.get(id) ?? null;
}

async function saveTest(kv: Deno.Kv | null, test: ABTest): Promise<void> {
  if (kv) {
    await kv.set(KV_TEST_KEY(test.id), test);
  } else {
    memTests.set(test.id, test);
  }
}

async function deleteTest(kv: Deno.Kv | null, id: string): Promise<void> {
  if (kv) {
    await kv.delete(KV_TEST_KEY(id));
    await kv.delete(KV_EVENTS_KEY(id));
  } else {
    memTests.delete(id);
    memEvents.delete(id);
  }
}

async function addEvent(kv: Deno.Kv | null, testId: string, ev: Event): Promise<void> {
  if (kv) {
    const list = (await kv.get(KV_EVENTS_KEY(testId))) as Deno.KvEntryMaybe<Event[]>;
    const arr = (list.value as Event[]) || [];
    arr.push(ev);
    await kv.set(KV_EVENTS_KEY(testId), arr);
  } else {
    const arr = memEvents.get(testId) || [];
    arr.push(ev);
    memEvents.set(testId, arr);
  }
}

async function getEvents(kv: Deno.Kv | null, testId: string): Promise<Event[]> {
  if (kv) {
    const r = await kv.get(KV_EVENTS_KEY(testId));
    return (r.value as Event[]) || [];
  }
  return memEvents.get(testId) || [];
}

// Deterministic hash: FNV-1a 32-bit
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function assignVariant(test: ABTest, userId: string): Variant {
  const seed = `${userId}:${test.id}`;
  const h = fnv1a(seed);
  const totalWeight = test.variants.reduce((s, v) => s + v.weight, 0) || 1;
  const bucket = (h % 10000) / 10000 * totalWeight;
  let acc = 0;
  for (const v of test.variants) {
    acc += v.weight;
    if (bucket < acc) return v;
  }
  return test.variants[0];
}

// Statistical helpers
function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function normalCdf(z: number) {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function zTestPValue(p1: number, n1: number, p2: number, n2: number) {
  if (n1 === 0 || n2 === 0) return 1;
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return 1;
  const z = (p1 - p2) / se;
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function computeStats(test: ABTest, events: Event[]) {
  const metrics = test.metrics.length ? test.metrics : ["view", "click", "conversion"];
  const variants = test.variants.map(v => {
    const variantEvents = events.filter(e => e.variantId === v.id);
    const viewCount = variantEvents.filter(e => e.event === "view").length || 0;
    const clickCount = variantEvents.filter(e => e.event === "click").length || 0;
    const conversionCount = variantEvents.filter(e => e.event === "conversion").length || 0;
    const times = variantEvents.filter(e => typeof e.timeOnPage === "number").map(e => e.timeOnPage as number);
    return {
      id: v.id,
      name: v.name,
      views: viewCount,
      clicks: clickCount,
      conversions: conversionCount,
      ctr: viewCount ? (clickCount / viewCount) * 100 : 0,
      cvr: viewCount ? (conversionCount / viewCount) * 100 : 0,
      avgTimeOnPage: mean(times),
      uniqueUsers: new Set(variantEvents.map(e => e.userId)).size,
    };
  });

  // Pairwise comparison: control vs each variant
  const control = variants[0];
  const comparisons = variants.slice(1).map(v => {
    const pVal = zTestPValue(control.cvr / 100, control.views, v.cvr / 100, v.views);
    return {
      controlId: control.id,
      variantId: v.id,
      lift: control.cvr > 0 ? ((v.cvr - control.cvr) / control.cvr) * 100 : 0,
      pValue: pVal,
      significant: pVal < 0.05,
    };
  });

  let winner: string | undefined;
  let bestP = -Infinity;
  variants.forEach(v => {
    if (v.views >= 100 && v.cvr > bestP) {
      bestP = v.cvr;
      winner = v.id;
    }
  });

  // Time series (hourly buckets)
  const buckets = new Map<number, Record<string, number>>();
  events.forEach(e => {
    const hour = Math.floor(e.ts / (60 * 60 * 1000)) * (60 * 60 * 1000);
    if (!buckets.has(hour)) buckets.set(hour, {});
    const b = buckets.get(hour)!;
    b[e.variantId] = (b[e.variantId] || 0) + 1;
  });
  const timeSeries = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, counts]) => ({
      ts,
      ...counts,
    }));

  return { variants, comparisons, winner, timeSeries };
}

serve(async (req) => {
  const opts = handleOptions(req);
  if (opts) return opts;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const kv = await getKv();

    if (ADMIN_ACTIONS.has(action)) {
      const authResult = await requireAdmin(req);
      if (authResult instanceof Response) return authResult;
    }

    switch (action) {
      case "list": {
        const tests = await listTests(kv);
        return jsonResponse({ tests });
      }

      case "get": {
        const id = body.id as string;
        const test = await getTest(kv, id);
        if (!test) return jsonResponse({ error: "Test bulunamadı" }, 404);
        const events = await getEvents(kv, id);
        const stats = computeStats(test, events);
        return jsonResponse({ test, stats });
      }

      case "create": {
        const input = body.test as Partial<ABTest>;
        if (!input.name) return jsonResponse({ error: "İsim zorunlu" }, 400);
        const variants: Variant[] = (input.variants || []).map((v, i) => ({
          id: v.id || `v-${i + 1}`,
          name: v.name || `Varyant ${i + 1}`,
          payload: v.payload || {},
          weight: v.weight ?? 1,
        }));
        const test: ABTest = {
          id: input.id || `t-${Date.now()}`,
          name: input.name,
          hypothesis: input.hypothesis || "",
          status: "draft",
          variants,
          trafficSplit: input.trafficSplit || variants.map(() => 1),
          metrics: input.metrics || ["view", "click", "conversion"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveTest(kv, test);
        return jsonResponse({ test });
      }

      case "update": {
        const id = body.id as string;
        const patch = body.patch as Partial<ABTest>;
        const existing = await getTest(kv, id);
        if (!existing) return jsonResponse({ error: "Test bulunamadı" }, 404);
        const updated: ABTest = {
          ...existing,
          ...patch,
          id: existing.id,
          updatedAt: new Date().toISOString(),
        };
        await saveTest(kv, updated);
        return jsonResponse({ test: updated });
      }

      case "delete": {
        const id = body.id as string;
        await deleteTest(kv, id);
        return jsonResponse({ ok: true });
      }

      case "assign": {
        const id = body.id as string;
        const userId = (body.user_id as string) || `anon-${crypto.randomUUID()}`;
        const test = await getTest(kv, id);
        if (!test) return jsonResponse({ error: "Test bulunamadı" }, 404);
        if (test.status !== "running") {
          return jsonResponse({ variant: test.variants[0] });
        }
        const variant = assignVariant(test, userId);
        return jsonResponse({ variant });
      }

      case "track": {
        const id = body.id as string;
        const userId = body.user_id as string;
        const variantId = body.variant_id as string;
        const event = body.event as string;
        if (!id || !variantId || !event) {
          return jsonResponse({ error: "Eksik parametre" }, 400);
        }
        await addEvent(kv, id, {
          variantId,
          userId: userId || "anon",
          event,
          ts: Date.now(),
          timeOnPage: typeof body.time_on_page === "number" ? body.time_on_page : undefined,
        });
        return jsonResponse({ ok: true });
      }

      case "stats": {
        const id = body.id as string;
        const test = await getTest(kv, id);
        if (!test) return jsonResponse({ error: "Test bulunamadı" }, 404);
        const events = await getEvents(kv, id);
        const stats = computeStats(test, events);
        return jsonResponse({ stats });
      }

      default:
        return jsonResponse({ error: `Bilinmeyen action: ${action}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return jsonResponse({ error: message }, 500);
  }
});
