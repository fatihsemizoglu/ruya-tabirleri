/**
 * RLS smoke verification using the public anon key.
 *
 * This does NOT prove every policy is correct, but it verifies the most
 * important external behavior: anonymous users can read public content and
 * cannot write to protected/public tables.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... node scripts/verify-rls.mjs
 *
 * The script also reads .env.production and .env.local if variables are absent.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadEnvFile(fileName) {
  const filePath = join(__dirname, '..', fileName);
  if (!existsSync(filePath)) return;

  const content = await readFile(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

await loadEnvFile('.env.production');
await loadEnvFile('.env.local');

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://dagjpitlouekbnwdcpbz.supabase.co';
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

function assertEnv() {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('❌ RLS doğrulaması için anon/public key gerekli.');
    console.error('   Gerekli env: VITE_SUPABASE_PUBLISHABLE_KEY veya SUPABASE_ANON_KEY');
    process.exit(2);
  }
}

async function rest(path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
}

async function expectReadOk(table, query) {
  const res = await rest(`${table}?${query}&limit=1`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} public read failed: HTTP ${res.status} ${text}`);
  }
  console.log(`✅ ${table}: public read OK`);
}

async function expectAnonWriteBlocked(table, payload) {
  const res = await rest(table, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 401 || res.status === 403) {
    console.log(`✅ ${table}: anon write blocked (HTTP ${res.status})`);
    return;
  }

  // PostgREST often returns 400/409/42501 for policy/constraint failures.
  // Treat explicit RLS/policy failures as success, but do not accept 2xx.
  const text = await res.text();
  if (!res.ok && /row-level security|rls|policy|permission denied|42501/i.test(text)) {
    console.log(`✅ ${table}: anon write blocked (${res.status}, policy error)`);
    return;
  }

  if (res.ok) {
    throw new Error(`❌ ${table}: anon write unexpectedly succeeded`);
  }

  console.warn(`⚠️ ${table}: anon write failed with non-policy error HTTP ${res.status}; review manually: ${text}`);
}

async function main() {
  assertEnv();
  console.log('🔐 RLS smoke doğrulaması başlıyor...');
  console.log(`   URL: ${SUPABASE_URL}`);

  await expectReadOk('dreams', 'select=id,slug&is_published=eq.true');
  await expectReadOk('categories', 'select=id,slug');
  await expectReadOk('blog_posts', 'select=id,slug&is_published=eq.true');
  await expectReadOk('site_settings', 'select=key,value');

  await expectAnonWriteBlocked('dreams', {
    title: 'RLS smoke test',
    slug: `rls-smoke-${Date.now()}`,
    content: 'should be blocked',
    is_published: true,
  });
  await expectAnonWriteBlocked('categories', {
    name: 'RLS Smoke',
    slug: `rls-smoke-${Date.now()}`,
  });
  await expectAnonWriteBlocked('dream_journal', {
    user_id: '00000000-0000-0000-0000-000000000000',
    title: 'RLS Smoke',
    content: 'should be blocked',
  });
  await expectAnonWriteBlocked('view_history', {
    user_id: '00000000-0000-0000-0000-000000000000',
    dream_id: '00000000-0000-0000-0000-000000000000',
  });

  console.log('\n✅ RLS smoke doğrulaması tamamlandı.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});