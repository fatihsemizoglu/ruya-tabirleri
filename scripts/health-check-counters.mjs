/**
 * Sayaç sistemi sağlık kontrolü — secret gerektirmez (anon/publishable key).
 *
 * Doğrular:
 *  1. Beğeni tabloları canlıda (comment_likes, dream_likes, blog_likes, blog_comment_likes)
 *  2. Sayaç RPC'leri mevcut (increment_view_count, search_dreams, count_search_dreams)
 *  3. increment_view_count anon tarafından çağrılabiliyor (204)
 *  4. Arama sayaçları tutarlı (search_dreams total_count == count_search_dreams)
 *
 * Kullanım:  node scripts/health-check-counters.mjs
 * Kullanım:  npm run check:counters
 */
import fs from 'node:fs';

function loadEnv(files) {
  const merged = {};
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, '');
      if (val && !(key in merged)) merged[key] = val; // ilk dolu değer kazanır
    }
  }
  return merged;
}

const env = loadEnv(['.env.local', '.env.production', 'supabase/.env']);
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('URL/KEY bulunamadı (.env.local veya .env.production kontrol edin)');
  process.exit(1);
}

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

// 1) Beğeni tabloları
const tables = ['comment_likes', 'dream_likes', 'blog_likes', 'blog_comment_likes', 'comments', 'blog_comments'];
for (const t of tables) {
  try {
    const res = await fetch(`${url}/rest/v1/${t}?select=id&limit=1`, { headers: H });
    check(`tablo ${t} erişilebilir`, res.status === 200, `HTTP ${res.status}`);
  } catch (e) {
    check(`tablo ${t} erişilebilir`, false, e.message);
  }
}

// 2) Sayaç RPC'leri mevcut mu (anon çağrı — rastgele UUID ile, veri değiştirmez)
const rpcProbes = [
  ['increment_view_count', { dream_id: crypto.randomUUID() }, (s) => s === 204 || s === 200],
  ['search_dreams', { search_query: 'yılan', limit_count: 5, offset_count: 0 }, (s) => s === 200],
  ['count_search_dreams', { search_query: 'yılan' }, (s) => s === 200],
];
for (const [name, args, okFn] of rpcProbes) {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${name}`, { method: 'POST', headers: H, body: JSON.stringify(args) });
    check(`RPC ${name} çalışıyor`, okFn(res.status), `HTTP ${res.status}`);
  } catch (e) {
    check(`RPC ${name} çalışıyor`, false, e.message);
  }
}

// 3) Arama tutarlılığı: search_dreams.total_count vs count_search_dreams
try {
  const [s, c] = await Promise.all([
    fetch(`${url}/rest/v1/rpc/search_dreams`, { method: 'POST', headers: H, body: JSON.stringify({ search_query: 'yılan', limit_count: 5, offset_count: 0 }) }),
    fetch(`${url}/rest/v1/rpc/count_search_dreams`, { method: 'POST', headers: H, body: JSON.stringify({ search_query: 'yılan' }) }),
  ]);
  const sData = await s.json();
  const cData = await c.json();
  const totalFromSearch = Array.isArray(sData) && sData.length > 0 ? sData[0].total_count : 0;
  const countFromRpc = typeof cData === 'number' ? cData : 0;
  check('search_dreams.total_count == count_search_dreams', totalFromSearch === countFromRpc, `${totalFromSearch} vs ${countFromRpc}`);
} catch (e) {
  check('search_dreams.total_count == count_search_dreams', false, e.message);
}

console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
