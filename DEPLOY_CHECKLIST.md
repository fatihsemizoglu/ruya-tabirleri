# Production Deployment Checklist

Bu dosya `ruya-tabirleri` projesinin Vercel + Supabase production ortamına
sorunsuz deploy edilmesi için gerekli tüm adımları içerir.

## 1. Hazırlık

- [ ] Tüm değişiklikler `main` branch'inde ve commit'lenmiş
- [ ] `npm run build` lokal olarak hatasız tamamlanıyor
- [ ] `npm run lint` hatasız
- [ ] `npx tsc --noEmit` hatasız
- [ ] Büyük dosyalar (görsel, video) Supabase Storage'a taşındı

## 2. Supabase Kurulum

### 2.1 Proje
- [ ] Production Supabase projesi oluşturuldu
- [ ] Bölge: `eu-central-1` (Frankfurt) — Vercel `fra1` ile eşleşiyor
- [ ] Database password güçlü ve güvenli yerde kayıtlı

### 2.2 Extensions (Database > Extensions)
- [ ] `pg_cron` etkin
- [ ] `http` etkin (pg_cron için gerekli)
- [ ] `pgcrypto` etkin (`gen_random_uuid` için)

### 2.3 Cron secret ayarla (SQL Editor)
```sql
ALTER DATABASE postgres SET app.cron_secret = 'GENERATE_RANDOM_32_CHARS';
```

### 2.4 pg_cron kurulum migration'ı çalıştır
- [ ] `supabase/migrations/20260614000000_pg_cron_setup.sql` dosyası
      SQL Editor'de çalıştırıldı
- [ ] `SELECT * FROM cron.job;` ile 4 job görünüyor
- [ ] `SELECT * FROM v_cron_jobs_status;` ile son durum izlenebiliyor

### 2.5 Edge Functions deploy
```bash
supabase functions deploy publish-scheduled-posts
supabase functions deploy sitemap
supabase functions deploy seo-audit
supabase functions deploy zero-results
supabase functions deploy interpret-dream
supabase functions deploy generate-content-suggestions
supabase functions deploy generate-internal-links
supabase functions deploy generate-seo
supabase functions deploy send-newsletter
supabase functions deploy subscribe-newsletter
supabase functions deploy ab-test-manager
```

### 2.6 Secret'lar (Edge Functions > Secrets)
- [ ] `AI_API_KEY` (OpenAI / Anthropic / OpenRouter)
- [ ] `AI_API_URL` (örn: `https://api.openai.com/v1/chat/completions`)
- [ ] `AI_MODEL` (örn: `gpt-4o-mini`)
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET` (yukarıdaki ile aynı)

### 2.7 Auth (Authentication > Providers)
- [ ] Email + Password etkin
- [ ] OAuth: Google (opsiyonel)
- [ ] Site URL: `https://ruya-tabirleri.com`
- [ ] Redirect URLs: `https://ruya-tabirleri.com/**`

### 2.8 RLS Politikaları
- [ ] Tüm tablolarda RLS açık
- [ ] `is_admin(auth.uid())` fonksiyonu mevcut
- [ ] Public tablolar (dreams, blog_posts, categories) için SELECT policy'ler tanımlı
- [ ] `dream_journal`, `favorites`, `view_history` sadece `user_id = auth.uid()` ile erişilebilir
- [ ] Admin tabloları (`search_logs`, `audit_logs`, `ab_test_*`) sadece admin

### 2.9 Backup
- [ ] Pro Plan'a yükseltildi (PITR için)
- [ ] Point-in-time recovery etkin (Settings > Database)
- [ ] Günlük backup planı var

## 3. Vercel Kurulum

### 3.1 Proje import
- [ ] Vercel Dashboard > New Project
- [ ] GitHub repo seçildi
- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install --legacy-peer-deps` (gerekirse)

### 3.2 Environment Variables (Production)
| Değişken | Değer |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://dagjpitlouekbnwdcpbz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > `anon` `public` |
| `VITE_SITE_URL` | Özel alan adı alınana dek boş bırak (fallback: `https://<proje>.vercel.app`); alan adı gelince `https://alanadi.com` yaz |
| `SENTRY_DSN` | (opsiyonel) Sentry projesinden |

> **Not:** Vite sadece `VITE_` prefix'li değişkenleri client bundle'a ekler.
> AI/Email/Cron secret'ları Vercel'e değil **Supabase Edge Function Secrets**'a konur.

### 3.3 Domains
- [ ] `ruya-tabirleri.com` eklendi
- [ ] `www.ruya-tabirleri.com` redirect ayarlandı
- [ ] DNS: `CNAME @ → cname.vercel-dns.com`
- [ ] DNS: `CNAME www → cname.vercel-dns.com`
- [ ] SSL otomatik (Let's Encrypt)

### 3.4 Cron Jobs
- [ ] Vercel `vercel.json` içindeki 4 cron job doğrulandı
      (alternatif olarak Supabase pg_cron kullanılıyor — ikisinden biri yeterli)
- [ ] Vercel Pro/Hobby hesap limitleri: Hobby'de günlük max 2 cron

## 4. Build Optimizasyonları (tamamlandı)

- [x] Stabil vendor chunk (React load-order circular dependency riskini önler)
- [x] ES2020 target
- [x] `esbuild` minify
- [x] `cssCodeSplit: true`
- [x] `reportCompressedSize: true` (gzip + brotli kontrol)
- [x] Long-term cache: `max-age=31536000, immutable` (assets)
- [x] No-cache: `sw.js` (PWA service worker)
- [x] Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

## 5. Monitoring & Observability

### 5.1 Vercel
- [ ] Vercel Analytics etkin (Web Vitals)
- [ ] Real User Monitoring (Speed Insights)

### 5.2 Sentry (Error Tracking) — Kurulum hazır

Kod tarafı tamamen hazır. Yapman gereken tek şey:

1. https://sentry.io adresinden **ücretsiz hesap** aç (veya mevcut hesabı kullan)
2. **Create Project** → Platform: `React` / `Vite` → Proje adı: `ruya-tabirleri`
3. **Settings > Projects > [proje] > Client Keys (DSN)**'den DSN'i kopyala
4. Vercel Dashboard > Project > Settings > Environment Variables:
   - `VITE_SENTRY_DSN` = kopyaladığın DSN (Production)
   - `VITE_APP_VERSION` = `1.0.0` (her release'te güncelle)
5. (Opsiyonel — source maps yüklemek için):
   - Sentry > Settings > Auth Tokens > **Create New Token** (`project:releases`, `project:debug_files` scope'ları)
   - Vercel > Settings > Environment Variables:
     - `SENTRY_AUTH_TOKEN` = token
     - `SENTRY_ORG` = org slug'ın
     - `SENTRY_PROJECT` = `ruya-tabirleri`

Source maps otomatik yüklenir, hata stack trace'leri readable olur.

**Kontrol:** Bir hata fırlat (`throw new Error("test")` console'a) → Sentry > Issues'da 1-2 sn içinde görünmeli.

### 5.3 Uptime Monitoring — Kurulum hazır

**Health endpoint hazır:** `https://ruya-tabirleri.com/api/health`
- 200 + `{ status: "ok" }` → sağlıklı
- 503 + `{ status: "down", checks: [...] }` → sorunlu (Supabase veya Edge Functions)

**Better Uptime** (önerilir — 5 dk kurulum):

1. https://betteruptime.com → ücretsiz hesap
2. **Monitors > Create Monitor > HTTP(s)**
3. Ayarlar:
   - Name: `Ruya Tabirleri - Production`
   - URL: `https://ruya-tabirleri.com/api/health`
   - Check interval: `1 minute`
   - Request timeout: `10 seconds`
   - Expected status code: `200`
   - Keyword: `"status":"ok"` (opsiyonel, body doğrulaması)
4. **Alerting > Integrations**:
   - E-posta (kendin)
   - SMS (opsiyonel — Pro)
   - Slack/Discord webhook (varsa)
5. **Status Page** (opsiyonel): Public status sayfası oluştur → embed et

**Alternatif: UptimeRobot** (daha basit, daha az özellik):
- https://uptimerobot.com → 50 monitor ücretsiz
- HTTPS monitor → URL: `/api/health` → 1 dk interval

### 5.4 Database Monitoring
- [ ] Supabase Dashboard > Database > Query Performance
- [ ] Slow query log izleniyor
- [ ] Connection pool metrikleri takip ediliyor

## 6. Smoke Tests (deploy sonrası)

- [ ] `https://ruya-tabirleri.com` açılıyor
- [ ] Ana sayfa 3 saniyenin altında yükleniyor
- [ ] Arama fonksiyonu çalışıyor
- [ ] Bir rüya detay sayfası açılıyor
- [ ] AI yorumlama çalışıyor
- [ ] Kullanıcı kayıt / giriş çalışıyor
- [ ] Newsletter subscribe çalışıyor
- [ ] Admin panel girişi çalışıyor
- [ ] `/sw.js` 200 dönüyor
- [ ] `/manifest.webmanifest` 200 dönüyor
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Performance score ≥ 80
- [ ] Lighthouse SEO score ≥ 95
- [ ] Lighthouse Accessibility score ≥ 90

## 7. SEO & Indexing

- [ ] Google Search Console doğrulandı
- [ ] `sitemap.xml` 200 dönüyor ve geçerli
- [ ] `robots.txt` doğru
- [ ] Open Graph meta'lar test edildi (Facebook Debugger)
- [ ] Twitter Card validator
- [ ] Schema.org markup (Article, BreadcrumbList) doğrulandı
- [ ] Hreflang yok (tek dil Türkçe)

## 8. Yasal & Compliance

- [ ] KVKK aydınlatma metni (`/gizlilik`)
- [ ] Kullanım koşulları (`/kullanim-kosullari`)
- [ ] Çerez politikası banner'ı
- [ ] 18+ yaş doğrulama (gerekirse)

## 9. Post-Deploy Monitoring (ilk 24 saat)

- [ ] Hata oranı < %0.5
- [ ] Response time p95 < 1.5s
- [ ] Cron job'lar doğru çalışıyor (`v_cron_jobs_status`)
- [ ] AI yorumlama hata oranı < %2
- [ ] Email gönderimleri başarılı
- [ ] DB connection pool < %80

## 10. Rollback Plan

Vercel:
```bash
vercel rollback
```
veya Vercel Dashboard > Deployments > önceki başarılı deployment'ı seç > "Promote to Production"

Supabase migration rollback:
```bash
supabase db reset --linked
# veya spesifik migration geri al
```

## Referanslar

- [Vercel Vite Docs](https://vercel.com/docs/frameworks/vite)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Web Vitals](https://web.dev/vitals/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
