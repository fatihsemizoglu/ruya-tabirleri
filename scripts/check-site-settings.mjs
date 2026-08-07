/**
 * Canlı site_settings tablosu ile src/lib/config.ts arasındaki tutarlılığı doğrular.
 *
 * Kullanım:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/check-site-settings.mjs
 *   # veya fallback: node scripts/check-site-settings.mjs <SERVICE_ROLE_KEY>
 *
 * Not: Key önce SUPABASE_SERVICE_ROLE_KEY env değişkeninden, yoksa komut satırı
 * argümanından okunur; yalnızca SELECT (doğrulama) için kullanılır.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!serviceKey) {
  console.error('Hata: SUPABASE_SERVICE_ROLE_KEY env değişkeni veya argüman verilmelidir.');
  console.error('Kullanım: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/check-site-settings.mjs');
  process.exit(1);
}

// Supabase URL'ini .env.local'daki VITE_SUPABASE_URL'den okur (tek kaynak, H4).
function readEnv(name) {
  for (const file of ['.env.local', '.env.production', '.env']) {
    try {
      const source = readFileSync(path.join(projectRoot, file), 'utf8');
      const match = source.match(new RegExp(`^${name}=["']?([^"'\r\n]+)`, 'm'));
      if (match) return match[1].trim();
    } catch {
      // Dosya yok — sonraki aday
    }
  }
  return undefined;
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL');

if (!SUPABASE_URL) {
  console.error('Hata: VITE_SUPABASE_URL bulunamadı (.env.local / .env.production / .env).');
  process.exit(1);
}

// config.ts'ten ilgili sabitleri çeker (yorum satırları hariç).
// Not: Regex parse, sabit formatı (çift tırnak/çok satır/template literal) değişirse
// sessizce başarısız olur — config.ts formatı stabil olduğundan risk düşüktür.
const configSource = readFileSync(path.join(projectRoot, 'src', 'lib', 'config.ts'), 'utf8');
const EXPECTED = {
  contactPhone: /export const SITE_PHONE = '([^']*)'/,
  contactEmail: /export const SITE_EMAIL = '([^']*)'/,
  contactAddress: /export const SITE_ADDRESS = '([^']*)'/,
  contactWorkingHours: /export const SITE_WORKING_HOURS = '([^']*)'/,
  mapLatitude: /export const MAP_LATITUDE = '([^']*)'/,
  mapLongitude: /export const MAP_LONGITUDE = '([^']*)'/,
};

function readConfig(key) {
  const match = configSource.match(EXPECTED[key]);
  return match ? match[1] : undefined;
}

const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=key,value`, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
});

if (!response.ok) {
  console.error(`Hata: DB sorgusu başarısız (HTTP ${response.status}): ${await response.text()}`);
  process.exit(1);
}

const rows = await response.json();
const live = new Map(rows.map((r) => [r.key, r.value]));

console.log('─'.repeat(64));
console.log('site_settings ↔ config.ts tutarlılık kontrolü');
console.log('─'.repeat(64));

let failed = false;
for (const key of Object.keys(EXPECTED)) {
  const configValue = readConfig(key);
  const dbValue = live.get(key);
  const match = configValue === dbValue;
  if (!match) failed = true;
  console.log(
    `  ${match ? '✓' : '✗'} ${key.padEnd(22)} DB: ${String(dbValue).padEnd(30)} config: ${String(configValue)}`
  );
}

console.log('─'.repeat(64));
console.log('Sosyal medya URL protokol kontrolü');
console.log('─'.repeat(64));

// Protokolsüz sosyal URLler (örn. "instagram.com/x") hrefte göreli link olur —
// Footer ve ContactInfo'da kırık link üretir. Tüm social* değerleri protokollü olmalı.
// src/lib/social.ts'teki ALLOWED_PROTOCOL ile birebir aynı mantık kullanılır:
// javascript:/data: gibi eksotik protokoller reddedilir.
const SOCIAL_KEYS = ['socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube', 'socialLinkedin', 'socialTiktok'];
for (const key of SOCIAL_KEYS) {
  const value = live.get(key);
  if (!value) {
    console.log(`  - ${key.padEnd(22)} (boş — atlandı)`);
    continue;
  }
  const str = String(value);
  const ok = str.startsWith('//') || /^(https?:\/\/|mailto:|tel:)/i.test(str);
  if (!ok) failed = true;
  console.log(`  ${ok ? '✓' : '✗'} ${key.padEnd(22)} ${value}`);
}

console.log('─'.repeat(64));
if (failed) {
  console.log('SONUÇ: TUTARSIZLIK VAR — yukarıdaki ✗ satırları düzeltilmelidir.');
  process.exit(1);
}
console.log('SONUÇ: Tutarlı ✓ (6/6 alan config ile eşleşiyor, sosyal URLler protokollü)');
