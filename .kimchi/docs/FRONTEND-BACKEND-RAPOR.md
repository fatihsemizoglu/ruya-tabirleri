# Rüya Tabirleri — Frontend & Backend Raporu

**Tarih:** 2026-07-23
**Repo:** `fatihsemizoglu/ruya-tabirleri`
**Branch:** `main`
**Stack özeti:** Vite 5 + React 18 SPA · Supabase (Postgres + Auth + Edge Functions) · Vercel serverless

---

## 1. Üst Düzey Mimari

```
┌────────────────────────────────────────────────────────────────────┐
│                       Vercel (region fra1)                         │
│  ┌──────────────┐   ┌────────────────────┐   ┌────────────────┐    │
│  │ Static SPA   │   │  /api/* (rewrite)  │   │ /api/health    │    │
│  │ (dist/)      │   │  → proxy →         │   │ /api/sitemap   │    │
│  │ PWA+SW       │   │   Supabase Edge Fn │   │ /api/cron/*    │    │
│  └──────────────┘   └────────────────────┘   │ /api/admin/*   │    │
│            ↑                  ↑               └────────────────┘    │
│  CSP+HSTS+nosniff           (anon key bearer)                       │
└────────────────────────────────────────────────────────────────────┘
                          │ HTTPS
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│  Supabase (project: dagjpitlouekbnwdcpbz)                          │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────────┐  │
│  │ Postgres     │   │ Auth           │   │ Edge Functions (Deno)│  │
│  │ + RLS        │   │ (email, OAuth) │   │ interpret-dream      │  │
│  │ + pg_cron    │   │                │   │ generate-seo         │  │
│  │ + Storage    │   │                │   │ publish-scheduled    │  │
│  │              │   │                │   │ sitemap, newsletter  │  │
│  └──────────────┘   └────────────────┘   └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                          ↑ HTTPS + (apikey, Bearer, x-cron-secret)
                          │
┌────────────────────────────────────────────────────────────────────┐
│  Browser  —  React 18 SPA, Service Worker (Workbox), IndexedDB?    │
│  Auth: localStorage persistSession + autoRefreshToken              │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend

### 2.1 Stack ve Sürümler (package.json)

| Katman | Teknoloji | Sürüm |
|---|---|---|
| Build | Vite + `@vitejs/plugin-react-swc` | 5.4 |
| Framework | React + ReactDOM | 18.3 |
| Dil | TypeScript (strict) | 5.8 |
| Routing | react-router-dom | 6.30 |
| Sunucu durumu | TanStack Query | 5.83 |
| Form / doğrulama | react-hook-form + zod + @hookform/resolvers | 7.61 / 3.25 |
| UI | Tailwind + shadcn/ui (Radix primitives) | 3.4 |
| Editör | TipTap (starter-kit + link/image/placeholder/…) | 3.18 |
| Grafik | Recharts | 2.15 |
| Animasyon | Framer Motion | 12.29 |
| Tarih | date-fns + react-day-picker | 3.6 / 8.10 |
| PWA | vite-plugin-pwa (Workbox) | 1.2 |
| Mobil | @capacitor/core + /cli + /android | 8.4 |
| İzleme | @sentry/react + @sentry/vite-plugin | 10.57 / 5.3 |
| Supabase | @supabase/supabase-js | 2.89 |
| SEO | react-helmet-async | 3.0 |
| Sanitize | DOMPurify | 3.4 |
| Toast | sonner | 1.7 |
| Komut | cmdk | 1.1 |

### 2.2 Routing (`src/App.tsx`)

- **Eager:** `Index`, `NotFound` (initial bundle).
- **Lazy:** diğer 28 sayfa + 3 global UI (CommandPalette, OnboardingTour, InstallPrompt).
- **Sentry ErrorBoundary:** yalnızca `VITE_SENTRY_DSN` varsa lazy yüklenir.
- **Korunan rotalar:** `ProtectedRoute` ile sarılı:
  - `/profil`, `/ruya-gunlugum`, `/ruya-gunlugum/sesli`, `/favorilerim`, `/gecmis`
  - `/admin/*` — `roles={['admin','moderator']}`
- **Hata sınırı:** Her içerik rotası `<RouteErrorBoundary label="…">` ile sarılı; çökme tek sayfada kalır.
- **SPA davranışı:** `ScrollToTop` her `pathname` değişiminde scroll resetler. `BrowserRouter` `v7_startTransition` + `v7_relativeSplatPath` ile gelecek uyumlu.
- **Deferred Global UI:** CommandPalette/OnboardingTour/InstallPrompt `requestIdleCallback` ile ertelenir (LCP iyileştirme).

### 2.3 Routing Haritası

| Path | Sayfa | Erişim |
|---|---|---|
| `/` | Index | Public |
| `/ara` | Search (Search.tsx, 35 KB) | Public |
| `/ruya/:slug` | DreamDetail (34 KB) | Public |
| `/karsilastir` | DreamCompare | Public |
| `/kategoriler` | Categories | Public |
| `/kategori/:slug` | CategoryDetail (38 KB) | Public |
| `/populer` | Popular (43 KB) | Public |
| `/akis` | DreamFeed | Public |
| `/az`, `/az/:letter` | AlphabetList (31 KB) | Public |
| `/blog`, `/blog/:slug`, `/blog/etiket/:tag` | Blog/BlogPost/BlogTag | Public |
| `/profil` | Profile (67 KB) | Auth |
| `/ruya-gunlugum`, `/ruya-gunlugum/sesli` | Journal (+Voice) | Auth |
| `/favorilerim`, `/gecmis` | Favorites, History | Auth |
| `/admin/*` | Admin | admin/moderator |
| `/hakkimizda`, `/iletisim`, `/gizlilik`, `/kullanim-kosullari`, `/kvkk`, `/cerez-politikasi` | Statik | Public |
| `/giris`, `/kayit`, `/sifremi-unuttum`, `/sifre-sifirla`, `/auth/callback`, `/email-dogrula` | Auth akışı | Public |
| `/yukle`, `/abonelik-dogrula`, `/abonelik-iptal` | Install / Subscription | Public |

### 2.4 Veri Katmanı (`src/lib/query/client.ts`)

```ts
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 dk, gcTime: 30 dk, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});
```

- **Merkezi `queryKeys` fabrikası:** dreams/categories/blog/auth/search/user/comments/admin için hiyerarşik key'ler. Tüm hook'lar bu key'leri kullanmalı (cache busting kolay).
- **Domain:** `dreams`, `categories`, `blog`, `auth`, `search`, `user`, `comments`, `admin` (admin altında dreams/categories/blog/comments/messages/subscribers/users/notifications/recent-activity/media/searchAnalytics/advancedStats/auditLogs/bulk).

### 2.5 Auth (`src/contexts/AuthProvider.tsx`)

- **Sağlayıcı:** Supabase Auth (localStorage persist + autoRefresh).
- **Akış:** Önce `onAuthStateChange` listener kurulur, sonra `getSession` çağrılır (Supabase önerisi). Bu sıralama race condition'ı önler.
- **Race guard:** `currentUserIdRef` + `initializedRef` ile duplicate fetch engellenir.
- **Profil + roller:** `profiles` ve `user_roles` tablolarından paralel çekilir (`Promise.all`).
- **Hata çevirisi:** `translateAuthError` Supabase İngilizce mesajlarını Türkçeye çevirir (12+ anahtar).
- **Sentry:** Giriş/çıkışta `setUser`/`setUser(null)` ve `isAdmin` tag'i senkronize.
- **Roller:** `admin` ⊃ `moderator` (moderator otomatik admin yetkisi almaz, ama `isModerator = moderator || isAdmin`).

### 2.6 Supabase İstemcisi (`src/integrations/supabase/client.ts`)

- `createClient<Database>(url, anonKey, { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } })`.
- `types.ts` (66 KB) otomatik üretilmiş tip sözlüğü; elle düzenlenmemeli.
- URL/key `.env.local`'den okunur, boşsa uygulama **crash eder** (throw).

### 2.7 PWA Stratejisi (`vite.config.ts` → `VitePWA`)

Workbox runtime cache kuralları:

| Pattern | Strateji | Cache | TTL |
|---|---|---|---|
| `request.mode === 'navigate'` | NetworkFirst | pages-cache-v2 | 5 sn timeout |
| `/api/sitemap` | NetworkFirst | public-api-cache | 1 saat |
| `dagjpitlouekbnwdcpbz.supabase.co/storage/...` | CacheFirst | supabase-images | 7 gün |
| same-origin image | StaleWhileRevalidate | local-images | 30 gün |
| same-origin script/style | StaleWhileRevalidate | static-assets | 7 gün |

- `navigateFallbackDenylist`: `/admin`, `/api`, dosya uzantıları — admin/api istekleri SW tarafından yakalanmaz.
- Manifest: TR locale, 3 kısayol (Ara, Günlük, Popüler), 192/512/maskable-512 iconlar, wide/narrow screenshot.
- `includeAssets`: favicon, robots, placeholder, offline.html.

### 2.8 Bundle Stratejisi (`vite.config.ts`)

`manualChunks` ile agresif satıcı bölümlemesi:

```
react-vendor, router-vendor, query-vendor, app-ui-vendor,
supabase-vendor, date-vendor, sanitize-vendor, interaction-vendor,
ui-vendor, editor-vendor, charts-vendor, motion-vendor, vendor
```

- `cssCodeSplit: true`, `target: es2020`, `minify: esbuild`.
- Sourcemap sadece `SENTRY_AUTH_TOKEN` varsa (gizlilik).
- `esbuild.drop: ['debugger']` yalnızca production.
- `chunkSizeWarningLimit: 800 KB` (varsayılan 500'den gevşek; kontrol edilebilir).
- `optimizeDeps.include: ['lucide-react']` — dev warm-up.

### 2.9 Hooks ve Özellikler

`src/hooks/` altında 22 özel hook:

| Hook | Amaç |
|---|---|
| `useABTest` | A/B test varyant atama (6 KB) |
| `useAuditLog` | Admin işlem logları |
| `useAuth` | Context köprüsü |
| `useDebounce` | Arama için |
| `useDreamCompare` | İki rüyayı yan yana karşılaştırma |
| `useFontSize` | Erişilebilirlik |
| `useGamification` | Rozet/XP |
| `useInfiniteScroll` | Feed/liste sayfalama |
| `useKeyboardShortcuts` | Klavye kısayolları |
| `useLongPress` | Mobil context menu |
| `useOfflineModeration` | Çevrimdışı moderasyon kuyruğu (7 KB) |
| `useOnboardingTour` | İlk ziyaret turu |
| `usePWA` | Install/state |
| `usePullToRefresh` | Mobil |
| `useReadingMode` | Okuma modu |
| `useRecentSearches` | localStorage |
| `useSearchAutocomplete` | Türkçe öneri |
| `useSelection` | Metin seçim menüsü |
| `useSiteSettings` | Maintenance, banner |
| `useVoiceSearch` | Web Speech API (4.6 KB) |
| `useWakeLock` | Ekran açık tut |

### 2.10 Pages — Büyük Dosyalar

En büyük sayfalar (kod bölme sayesinde lazy yüklenir):
- `Profile.tsx` — 67 KB
- `Popular.tsx` — 43 KB
- `CategoryDetail.tsx` — 38 KB
- `Search.tsx` — 36 KB
- `Favorites.tsx` — 35 KB
- `DreamDetail.tsx` — 34 KB
- `Contact.tsx` — 35 KB
- `BlogPost.tsx` — 22 KB
- `Blog.tsx` — 20 KB
- `History.tsx` — 21 KB
- `DreamJournal.tsx` — 27 KB

İlk yükleme (eager) yalnızca `Index` (1.6 KB) + `NotFound` (4.9 KB). Performans açısından iyi.

### 2.11 UI Bileşenleri (`src/components/`)

- `ui/` — shadcn/ui kök bileşenleri (button, dialog, sheet, tabs, toast, command-palette vb.)
- `layout/` — Header, Footer, MaintenanceModeGuard
- `auth/` — ProtectedRoute
- `admin/` — Admin panel parçaları
- `blog/`, `dream/`, `search/`, `share/` — domain parçaları
- `pwa/` — OfflineIndicator, SWUpdatePrompt, InstallPrompt
- `onboarding/`, `gamification/`, `perf/` (WebVitals), `newsletter/`, `contact/`

### 2.12 SEO & Meta

- `react-helmet-async` global sağlayıcı; `Seo.tsx` ortak helper.
- Canonical/OG için `VITE_SITE_URL`.
- `sitemap.xml` Vercel `api/sitemap.ts` üzerinden Supabase `sitemap` edge function'ından proxy.

### 2.13 Observability (Frontend)

- `WebVitals` global olarak bağlı (CLS/LCP/INP).
- `src/lib/logger.ts` → `captureError` (Sentry). **Önemli:** `vite.config.ts` `esbuild.drop: ['debugger']` yalnızca `debugger` ifadelerini düşürür; `console.*` korunur. Ama log helper docstring'i `console.*` `drop` ediliyor gibi yazıyor — bu yanlış; gerçek drop yalnızca production bundle'da Sentry yoksa düşürülebilir.
- `captureError` Sentry import'u DSN yoksa bile Sentry modülünü içeri alır (DSN olmadan no-op).

---

## 3. Backend

Backend üç katmandan oluşur:

### 3.1 Vercel Serverless (`api/`)

| Endpoint | Tip | Amaç |
|---|---|---|
| `/api/health` | Vercel handler (TS) | Uptime + Supabase/Edge probe |
| `/api/sitemap` | Vercel handler (TS) | Edge function'a POST proxy |
| `/api/cron/publish-scheduled-posts` | Edge function proxy (rewrite) | Zamanlanmış yayın |
| `/api/cron/sitemap` | Edge function proxy | Sitemap üretimi |
| `/api/cron/seo-audit` | Edge function proxy | SEO rapor |
| `/api/cron/zero-results` | Edge function proxy | Sıfır sonuç analizi |
| `/api/admin/seo-audit` | Edge function proxy | Admin SEO |
| `/api/admin/zero-results` | Edge function proxy | Admin zero-results |

> **Önemli:** `/api/cron/*` ve `/api/admin/*` için Vercel tarafında **dosya yok** — sadece rewrite kuralı var. Yani `vercel.json`'daki `/api/(.*)` rewrite'i tüm bu yolları doğrudan Supabase Edge Function'a yönlendiriyor. Bu bir **DRY ihlali ve güvenlik riski**: Vercel katmanında ek kontrol yok.

#### `api/health.ts`
- **Sağlık kontrolü:** Supabase root (`HEAD`) + Edge Function yolu (`HEAD` ile erişilebilirlik).
- **Yanıt:** `{ status: 'ok'|'degraded'|'down', version, timestamp, uptime_s, checks[] }`.
- **Timeout:** 5 sn / probe.
- **HTTP kodu:** `down` ise 503, aksi 200.
- **Güzel yanı:** SERVICE_ROLE'a fallback **yok** (kullanıcının yorumu buna özellikle dikkat çekmiş).
- **Şüpheli yanı:** Edge Function HEAD'i 401 (auth-gated) dönerse "reachable (auth-gated)" sayıyor; gerçek sağlığı garanti etmiyor.

#### `api/sitemap.ts`
- Supabase `sitemap` edge function'ına POST, `x-cron-secret` header ile.
- Cache: `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`.
- Hata: 502 (upstream) / 500 (config eksik) / 405 (yanlış method).

### 3.2 Vercel Konfigürasyonu (`vercel.json`)

- **Region:** `fra1` (Frankfurt).
- **SPA fallback:** `/` → `/index.html` (son rewrite kuralı).
- **API proxy:** `/api/(.*)` → `https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1/$1`.
- **CORS-equivalent:** Vercel tarafında değil, Supabase `cors.ts`'te kontrol ediliyor.

#### Güvenlik Header'ları (global)

| Header | Değer |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(self), microphone=(self), geolocation=(self), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | (bkz. aşağı) |

#### CSP
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://www.googletagmanager.com;
worker-src 'self' blob:;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: blob: https:;
media-src 'self' blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://o0.ingest.sentry.io https://*.sentry.io https://*.ingest.sentry.io;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
```

**Not:** `'unsafe-inline'` + `'unsafe-eval'` script-src'de var — Sentry/GTag/React dev için gerekli. Production hardening mümkün (nonce-based).

#### Cache Header'ları
- `/sw.js` → `no-cache, no-store, must-revalidate` + `Service-Worker-Allowed: /`
- `/manifest.webmanifest` → `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
- `/index.html` → `public, max-age=0, must-revalidate`
- `*.png` ve `/assets/*` → `public, max-age=31536000, immutable`

### 3.3 Supabase Edge Functions (`supabase/functions/`)

11 edge function (Deno runtime, `verify_jwt` ayarları `config.toml`'da):

| Function | verify_jwt | Koruma | Amaç |
|---|---|---|---|
| `interpret-dream` | **false** | — (anon) | AI yorumu (OpenAI/Gemini-uyumlu) |
| `generate-seo` | true | JWT | Blog SEO üretimi |
| `generate-content-suggestions` | true | JWT | Blog fikir önerisi |
| `generate-internal-links` | true | JWT | İç link önerisi |
| `publish-scheduled-posts` | false | `x-cron-secret` | Zamanlanmış blog yayını |
| `send-newsletter` | true | JWT | Resend üzerinden mail |
| `subscribe-newsletter` | false | — (anon) | Email kayıt |
| `sitemap` | false | `x-cron-secret` | XML sitemap üretimi |
| `ab-test-manager` | false | — (anon) | A/B test varyant seçimi |
| `publish-scheduled-posts` | false | `x-cron-secret` | — |
| `admin/seo-audit` | (config.toml'da yok) | ? | — |
| `admin/zero-results` | (config.toml'da yok) | ? | — |

> **Sorun:** `admin/` ve `cron/` altındaki function'lar `config.toml`'da listelenmemiş → `verify_jwt` default true olur. Vercel rewrite üzerinden erişim için JWT gerekir; bu nedenle Vercel→Supabase proxy ya kullanıcı JWT'si ile ya da `apikey` header'ı ile çalışmalı.

#### `_shared/` Modülleri
- **`ai.ts`:** `getAiApiKey()` — `AI_API_KEY` veya `GEMINI_API_KEY` döner. URL/model doğrudan env'den okunur, default OpenAI `gpt-4o-mini`.
- **`auth.ts`:** `requireAdmin(req)` (JWT doğrula + `user_roles.admin` kontrol), `requireCronSecret(req)` (`x-cron-secret` header kontrol).
- **`cors.ts`:** `getCorsHeaders(origin)` — `ALLOWED_ORIGINS` env boşsa default `"*"` (**production riski**); `jsonResponse`, `handleOptions` helper'ları.

#### `interpret-dream/index.ts` (örnek akış)
1. OPTIONS → 204
2. Authorization opsiyonel (anon çağrı kabul edilir → **maliyet kontrolsüz**)
3. JSON body parse: `{ dreamId, dreamText, dreamTitle, dreamMood, includeSimilar }`
4. `dreamText.length < 10` → 400
5. `AI_API_KEY` yoksa → 500
6. OpenAI-uyumlu chat completion isteği
7. JSON parse, mümkünse `interpretations` tablosuna insert
8. 200 ile döndür

---

## 4. Veritabanı (Postgres)

### 4.1 Migration Tarihçesi

37+ migration. Önemli kilometre taşları:

| Tarih | Başlık | Amaç |
|---|---|---|
| 2025-12-23 | `…0338a9b1-…` (16 KB) | İlk şema (dreams, categories, profiles, vs.) |
| 2026-02-03 | `…_featured_at_…` | Öne çıkan rüyalar |
| 2026-06-09 | `guest_comments` | Misafir yorum |
| 2026-06-12 | `search_pagination_and_security` | Sayfalama + güvenlik |
| 2026-06-13 | `missing_fks_and_indexes` | Performans |
| 2026-06-14 | `pg_cron_setup` | pg_cron işleri |
| 2026-06-15 | `gamification_schema` | Rozet/XP/leaderboard |
| 2026-06-16 | `accent_insensitive_search` | Türkçe karakter normalizasyonu |
| 2026-06-16 | `search_total_count_single_rpc` | Toplam sonuç RPC |
| 2026-06-23 | `blog_view_count_rpc`, `performance_indexes` | Sayaç + indexler |
| 2026-07-02 | `enable_rls_on_public_tables` | RLS hardening |
| 2026-07-05 | `search_dreams_return_featured_and_created` | Sıralama |

### 4.2 Arama (`search_dreams` RPC)

`accent_insensitive_search.sql`:
```sql
CREATE FUNCTION public.normalize_search_text(value TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(translate(coalesce(value, ''),
    'İIıŞşĞğÜüÖöÇçÂâÎîÛû',
    'iiissgguuooccaaiiuu'))
$$;
```

`search_dreams(search_query, limit_count, offset_count)` `SECURITY DEFINER` ile:
- Normalize edilmiş sorguyu hem başlığa hem sluge uygular.
- Sıralama: tam eşleşme (2) > başlık LIKE (1) > slug LIKE (0.8).
- Boş sorgu → boş sonuç.

### 4.3 pg_cron

`pg_cron_setup.sql` + `schedule_cron_jobs.sql` + `reschedule_cron_jobs_correct_project.sql` ile:
- publish-scheduled-posts (sıklık?)
- send-newsletter
- sitemap üretimi

### 4.4 RLS

`enable_rls_on_public_tables.sql` (11.8 KB) — tüm public tablolar için RLS politikaları. Erişim modelleri:
- Dreams: public SELECT, authenticated INSERT (pending).
- Yorumlar: guest_comments migration'ı ile misafir yorum izni.
- Newsletter: sadece admin.

---

## 5. Konfigürasyon ve Deployment

### 5.1 Ortam Değişkenleri

**Frontend (`VITE_*`):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`
- `VITE_SENTRY_DSN` (opsiyonel)
- `VITE_APP_VERSION`

**Vercel (runtime):**
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `HEALTHCHECK_SUPABASE_URL` / `HEALTHCHECK_SUPABASE_ANON_KEY` (sağlık kontrolü override)
- `CRON_SECRET` (sitemap için)

**Supabase Edge Function Secrets:**
- `AI_API_KEY` veya `GEMINI_API_KEY`
- `AI_API_URL` (default OpenAI)
- `AI_MODEL` (default `gpt-4o-mini`)
- `RESEND_API_KEY` (newsletter)
- `CRON_SECRET` (cron function'ları)
- `SITE_URL` (sitemap canonical)
- `ALLOWED_ORIGINS` (CORS whitelist)

### 5.2 Capacitor (Android)

`capacitor.config.json` + `android/` klasörü. `npm run cap:build:android` ile Android APK üretilir.

### 5.3 CI/CD

`.github/workflows/vercel-deploy.yml` (muhtemelen) — `main` push'unda lint + typecheck + Vercel prod build.

---

## 6. Bulgular ve Öneriler

### 6.1 Güvenlik ✅ İyi Yanlar
1. `api/health.ts`'te SERVICE_ROLE key fallback'i **yok** — doğru.
2. CSP iyi tanımlanmış, Sentry/Resend/Supabase origin'leri explicit.
3. HSTS preload ile sıkılaştırılmış.
4. Service Worker için `Service-Worker-Allowed: /` doğru.
5. `navigateFallbackDenylist` admin/api'yi SW'den muaf tutuyor.
6. Auth'da race condition guard'ı var.
7. CSP'de `frame-ancestors 'self'` ile clickjacking koruması.

### 6.2 Güvenlik ⚠️ Riskler
1. **`interpret-dream` anon erişime açık (`verify_jwt=false`).** AI API maliyeti kontrolsüz — birisi 1000 çağrı yapabilir. Rate limit + JWT zorunluluğu önerilir.
2. **`_shared/cors.ts`** `ALLOWED_ORIGINS` boşsa default `"*"` — production'da tüm origin'lerden CORS açık. **Default'u `"*"` yerine Supabase origin'ine sabitlemek daha güvenli.**
3. **Vercel `/api/cron/*` ve `/api/admin/*`** katmanında auth/secret kontrolü yok; doğrudan Supabase'a rewrite. `config.toml`'da bu function'lar eksik → `verify_jwt` default true olur; dolayısıyla Supabase tarafında `apikey` + `Authorization` header'ı beklenir. Vercel'in bunları eklemediği yerde 401 alınır.
4. **`api/health.ts`** Edge Function HEAD'i 401 dönerse "reachable" sayıyor — yarı yanlış sinyal.
5. **`api/sitemap.ts`** POST kullanıyor; Supabase `sitemap` function muhtemelen POST bekliyor (CRON_SECRET POST body'de değil header'da). Rewrite zaten Supabase'a proxy yaptığına göre bu Vercel handler'ı fazladan sıçrama — gereksiz.
6. **CSP** `'unsafe-inline'` + `'unsafe-eval'` script-src'de — Sentry/GTag için gerekli ama XSS yüzey alanı açık. Nonce-based CSP'ye geçiş orta vadeli hedef olmalı.

### 6.3 Mimari / DRY
1. **`api/cron/*` ve `supabase/functions/cron/*` aynı iş için mi?** Vercel rewrite tüm `/api/*`'yi Supabase'a yönlendiriyor, ama `api/cron/*` altında dosyalar yok — yani tüm bu rotalar doğrudan Supabase Edge Function'a gidiyor. `api/admin/*` için de aynı durum geçerli. **Neden `api/` klasöründe dosya var gibi görünüyor?** Gerçek uygulama: `/api/(.*)` Supabase'a proxy, Vercel handler'ları yalnızca `/api/health` ve `/api/sitemap`.
2. **`publish-scheduled-posts` hem Supabase cron (pg_cron) hem Vercel cron için mi?** İki yol da var — hangisi aktif? (Muhtemelen pg_cron `pg_cron_setup.sql` ile aktif.)
3. **Bundle boyutu:** `ui-vendor` (Radix + lucide + cmdk) ve `editor-vendor` (TipTap) büyük olabilir. Stats.html (`npm run analyze`) ile kontrol edilmeli.
4. **Logging doc yanlış:** `src/lib/logger.ts` docstring'i `console.*` `drop` ediliyor yazıyor ama `vite.config.ts` yalnızca `debugger` drop ediyor. Yanıltıcı.

### 6.4 Performans
1. **Initial bundle** yalnızca Index + NotFound + React vendor + router + query + supabase vendor → iyi.
2. **Service Worker** navigation için NetworkFirst 5 sn timeout + stale cache — offline UX iyi.
3. **Supabase storage** CacheFirst 7 gün — bandwidth tasarrufu iyi.
4. **TanStack Query** staleTime 5 dk / gcTime 30 dk — makul; ama infinite scroll için staleTime düşürülebilir.
5. **TipTap editörü** lazy yüklenmiyor (admin route'unda ama yine de); `editor-vendor` chunk'ı iyi.

### 6.5 Önerilen Aksiyonlar (Öncelik sırasıyla)

| # | Aksiyon | Etki | Zorluk |
|---|---|---|---|
| 1 | `interpret-dream`'e JWT zorunluluğu + rate limit ekle | Maliyet kontrolsüz çağrıları engeller | Orta |
| 2 | `_shared/cors.ts` default origin'i sabitle | CORS yüzey alanını daraltır | Düşük |
| 3 | `api/health.ts` 401'i "warn" olarak işaretle | Sağlık sinyali kalitesi | Düşük |
| 4 | `api/sitemap.ts` Supabase proxy'i kaldır, direkt rewrite | Latency + maliyet | Düşük |
| 5 | CSP nonce-based inline script'ler | XSS yüzey alanı | Yüksek |
| 6 | `src/lib/logger.ts` docstring'i düzelt | Yanlış bilgi | Düşük |
| 7 | `package.json` `chunkSizeWarningLimit` 800 → 600 | Bundle farkındalığı | Düşük |
| 8 | `pages` `protectedRoutes` için admin route'una `roles` reload sonrası persist kontrolü | UX | Orta |
| 9 | `vercel.json` `crons: []` → gerçek Vercel cron tanımla (pg_cron yerine) | Tek doğruluk kaynağı | Orta |
| 10 | `useOfflineModeration` (7 KB) test coverage ekle | Regresyon güvencesi | Orta |

---

## 7. Özet Skor

| Alan | Puan | Yorum |
|---|---|---|
| Mimari netliği | ⭐⭐⭐⭐½ | SPA + edge function + vercel proxy iyi ayrılmış |
| Frontend kalitesi | ⭐⭐⭐⭐ | Lazy/code-split, hata sınırları, PWA, SEO titiz |
| Backend güvenliği | ⭐⭐⭐½ | CORS default * ve anon AI erişimi zayıf halka |
| Performans | ⭐⭐⭐⭐ | Bundle stratejisi + SW + RLS iyi |
| Gözlemlenebilirlik | ⭐⭐⭐⭐ | Sentry + WebVitals + sağlık kontrolü var |
| DRY / tutarlılık | ⭐⭐⭐ | İki paralel cron yolu (Vercel + pg_cron) karışıklık |
| Dokümantasyon | ⭐⭐⭐⭐ | README + DENETIM + DEPLOY_CHECKLIST mevcut |

**Genel:** Olgun, iyi organize edilmiş, prod-ready bir proje. Birkaç güvenlik sertleştirme (özellikle AI endpoint ve CORS) ve küçük DRY düzeltmeleriyle daha da sağlamlaşır.
