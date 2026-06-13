/**
 * Health check endpoint for uptime monitoring.
 * Probes Supabase + Edge Function surface to detect partial outages.
 *
 * GET /api/health
 * → 200 with JSON status
 *
 * Uptime monitoring should hit this every 30-60s.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL =
  process.env.HEALTHCHECK_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
// NOTE: NEVER fall back to SERVICE_ROLE — it's for server-side admin only and
// will be rejected by the public REST API ("Secret API key required").
// Vercel serverless functions do NOT see VITE_ prefixed vars at runtime
// (those are build-time client-bundle only), and Vercel's Supabase
// integration auto-injects SUPABASE_URL which we want to override.
const SUPABASE_ANON_KEY =
  process.env.HEALTHCHECK_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';
const TIMEOUT_MS = 5000;

type CheckStatus = 'ok' | 'warn' | 'fail';

interface CheckResult {
  name: string;
  status: CheckStatus;
  latency_ms?: number;
  detail?: string;
  response_body?: string;
}

interface HealthPayload {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  uptime_s: number;
  checks: CheckResult[];
}

const startTime = Date.now();

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkSupabase(): Promise<CheckResult> {
  if (!SUPABASE_URL) {
    return { name: 'supabase_rest', status: 'fail', detail: 'URL not set', response_body: envDebug() };
  }
  if (!SUPABASE_ANON_KEY) {
    return { name: 'supabase_rest', status: 'fail', detail: 'Key not set', response_body: envDebug() };
  }
  const start = Date.now();
  try {
    // Probe /auth/v1/settings which is the most reliable health check —
    // returns 200 with the auth config (works with both anon and service_role keys)
    const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const latency = Date.now() - start;
    const body = await res.text().catch(() => '');
    if (!res.ok) {
      return { name: 'supabase_rest', status: 'fail', latency_ms: latency, detail: `HTTP ${res.status}`, response_body: body.slice(0, 200) };
    }
    return { name: 'supabase_rest', status: latency < 2000 ? 'ok' : 'warn', latency_ms: latency };
  } catch (err) {
    return { name: 'supabase_rest', status: 'fail', detail: (err as Error).message };
  }
}

function envDebug(): Record<string, unknown> {
  return {
    url_set: !!SUPABASE_URL,
    url: SUPABASE_URL ? SUPABASE_URL.replace(/\/\/.+@/, '//***@') : null,
    key_set: !!SUPABASE_ANON_KEY,
    key_prefix: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 12) + '...' : null,
  };
}

async function checkEdgeFunctions(): Promise<CheckResult> {
  if (!SUPABASE_URL) {
    return { name: 'edge_functions', status: 'fail', detail: 'VITE_SUPABASE_URL not set' };
  }
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/sitemap`, {
      method: 'HEAD',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const latency = Date.now() - start;
    if (res.status === 401 || res.status === 404) {
      return { name: 'edge_functions', status: 'ok', latency_ms: latency, detail: 'reachable (auth-gated)' };
    }
    if (!res.ok && res.status >= 500) {
      return { name: 'edge_functions', status: 'fail', latency_ms: latency, detail: `HTTP ${res.status}` };
    }
    return { name: 'edge_functions', status: latency < 3000 ? 'ok' : 'warn', latency_ms: latency };
  } catch (err) {
    return { name: 'edge_functions', status: 'fail', detail: (err as Error).message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [supabase, edge] = await Promise.all([checkSupabase(), checkEdgeFunctions()]);

  const checks = [supabase, edge];
  const hasFail = checks.some(c => c.status === 'fail');
  const hasWarn = checks.some(c => c.status === 'warn');

  const status: HealthPayload['status'] = hasFail ? 'down' : hasWarn ? 'degraded' : 'ok';
  const httpStatus = hasFail ? 503 : 200;

  const payload: HealthPayload = {
    status,
    version: process.env.VITE_APP_VERSION || 'dev',
    timestamp: new Date().toISOString(),
    uptime_s: Math.floor((Date.now() - startTime) / 1000),
    ...(supabase.status === 'fail' ? { env_debug: envDebug() } : {}),
    checks,
  };

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  return res.status(httpStatus).json(payload);
}
