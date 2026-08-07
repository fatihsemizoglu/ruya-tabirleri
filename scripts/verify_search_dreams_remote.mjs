#!/usr/bin/env node
/**
 * verify_search_dreams_remote.mjs
 *
 * search_dreams / count_search_dreams filtre + sayfalama tutarlılık testi.
 * Secret GEREKMEZ: fonksiyonlar PUBLIC-çağrılabilir olduğu için publishable
 * (anon) anahtar ile REST üzerinden test edilir.
 *
 * Kullanım:  node scripts/verify_search_dreams_remote.mjs ["arama terimi"]
 *
 * Ön koşul: supabase/migrations/20260806000000_search_dreams_filters.sql
 * migration'ı Supabase'e uygulanmış olmalı. Uygulanmadıysa RPC çağrıları
 * hata döner ve tüm kontroller FAIL görünür (HTTP hatası detayda yer alır).
 *
 * Ayrıca supabase/verify_search_dreams.sql adlı SQL Editor sürümü de mevcuttur.
 */
import fs from 'node:fs';

function loadEnv(file) {
  const env = {};
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* dosya yoksa boş döner */
  }
  return env;
}

// Boş değerler (örn. .env.production'daki boş VITE_SUPABASE_PUBLISHABLE_KEY)
// daha önce yüklenen geçerli değeri ezmesin — ilk dolu değer kazanır.
const env = {};
for (const file of ['.env.local', '.env.production']) {
  for (const [key, value] of Object.entries(loadEnv(file))) {
    if (value) env[key] = value;
  }
}
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY bulunamadı (.env.local).');
  process.exit(1);
}

const PAGE_SIZE = 24;
const searchTerm = process.argv[2] || 'yılan';

let failures = 0;
let skips = 0;

function check(name, ok, detail = '') {
  const tag = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ''}`);
}

function skip(name, detail = '') {
  skips++;
  console.log(`SKIP ${name}${detail ? ` — ${detail}` : ''}`);
}

async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${fn} HTTP ${res.status}: ${text.slice(0, 220)}`);
  }
  return res.json();
}

const rpcTotal = (rows) =>
  Array.isArray(rows) && rows.length ? Math.max(...rows.map((r) => r.total_count ?? 0)) : 0;

console.log(`== search_dreams filtre/sayfalama doğrulama (sorgu: "${searchTerm}") ==\n`);

try {
  // ---- T1: temel, filtre yok ----
  const t1 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0 });
  const c1 = await rpc('count_search_dreams', { search_query: searchTerm });
  const t1total = rpcTotal(t1);
  check('T1 temel total tutarlı', typeof c1 === 'number' && t1total === c1 && t1total > 0, `rpc=${t1total} count=${c1}`);

  // ---- T2: yalnızca öne çıkanlar ----
  const t2 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0, featured_only: true });
  const c2 = await rpc('count_search_dreams', { search_query: searchTerm, featured_only: true });
  const badFeatured = t2.filter((r) => r.is_featured !== true).length;
  const t2total = rpcTotal(t2);
  check('T2 featured_only', badFeatured === 0 && t2total === c2, `featured-olmayan=${badFeatured} rpc=${t2total} count=${c2}`);

  // ---- T3: min_views >= 50 ----
  const t3 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0, min_views: 50 });
  const c3 = await rpc('count_search_dreams', { search_query: searchTerm, min_views: 50 });
  const badViews = t3.filter((r) => (r.view_count ?? 0) < 50).length;
  const t3total = rpcTotal(t3);
  check('T3 min_views=50', badViews === 0 && t3total === c3, `eşik-altı=${badViews} rpc=${t3total} count=${c3}`);

  // ---- T4: min_likes >= 5 ----
  const t4 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0, min_likes: 5 });
  const c4 = await rpc('count_search_dreams', { search_query: searchTerm, min_likes: 5 });
  const badLikes = t4.filter((r) => (r.like_count ?? 0) < 5).length;
  const t4total = rpcTotal(t4);
  check('T4 min_likes=5', badLikes === 0 && t4total === c4, `eşik-altı=${badLikes} rpc=${t4total} count=${c4}`);

  // ---- T5: kategori filtresi (arama sonuçlarından bir kategori türet) ----
  const cat = t1.find((r) => r.category_id)?.category_id ?? null;
  if (!cat) {
    skip('T5 kategori', 'sonuçlarda category_id yok');
  } else {
    const t5 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0, category_ids: [cat] });
    const c5 = await rpc('count_search_dreams', { search_query: searchTerm, category_ids: [cat] });
    const badCat = t5.filter((r) => r.category_id !== cat).length;
    const t5total = rpcTotal(t5);
    check('T5 kategori', badCat === 0 && t5total === c5, `yanlış-kategori=${badCat} rpc=${t5total} count=${c5}`);
  }

  // ---- T6: sort_by='views' — azalan view_count sırası ----
  const t6 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: 0, sort_by: 'views' });
  let sortBad = 0;
  for (let i = 1; i < t6.length; i++) {
    if ((t6[i].view_count ?? 0) > (t6[i - 1].view_count ?? 0)) sortBad++;
  }
  check('T6 sort_by=views', sortBad === 0, `sıra-dışı=${sortBad}`);

  // ---- T7: birleşik filtreler + sort_by='newest' ----
  if (cat) {
    const args7 = {
      search_query: searchTerm,
      limit_count: PAGE_SIZE,
      offset_count: 0,
      featured_only: true,
      category_ids: [cat],
      min_views: 10,
      min_likes: 1,
      sort_by: 'newest',
    };
    const t7 = await rpc('search_dreams', args7);
    const c7 = await rpc('count_search_dreams', {
      search_query: searchTerm,
      featured_only: true,
      category_ids: [cat],
      min_views: 10,
      min_likes: 1,
    });
    const bad7 = t7.filter(
      (r) => r.is_featured !== true || r.category_id !== cat || (r.view_count ?? 0) < 10 || (r.like_count ?? 0) < 1
    ).length;
    const t7total = rpcTotal(t7);
    check('T7 birleşik filtreler', bad7 === 0 && t7total === c7, `kuraldışı=${bad7} rpc=${t7total} count=${c7}`);
  }

  // ---- T8: sayfalama tutarlılığı ----
  const p1 = t1; // page 1 (T1'den)
  const p2 = await rpc('search_dreams', { search_query: searchTerm, limit_count: PAGE_SIZE, offset_count: PAGE_SIZE });
  const p1Ids = new Set(p1.map((r) => r.id));
  const dup = p2.filter((r) => p1Ids.has(r.id)).length;
  const sumOk = p1.length + p2.length === Math.min(typeof c1 === 'number' ? c1 : 0, PAGE_SIZE * 2);
  check('T8 sayfalama', dup === 0 && sumOk, `p1=${p1.length} p2=${p2.length} dup=${dup} total=${c1}`);
} catch (err) {
  failures++;
  console.error(`\nFATAL: ${err.message}`);
  console.error('\nMigration uygulanmadıysa RPC hata döner. Önce 20260806000000_search_dreams_filters.sql');
  console.error('Supabase SQL Editor veya supabase db push ile uygulanmalı.');
}

console.log(`\n== SONUÇ: ${failures} hata, ${skips} atlandı ==`);
process.exit(failures > 0 ? 1 : 0);
