# Rüya Tabirleri — Kapsamlı Denetim Raporu (Güncellenmiş)

**Tarih:** 2026-07-30
**Kapsam:** Frontend + Backend hata düzeltmeleri, performans analizi, SEO analizi, yeni özellik önerileri
**Stack:** Vite 5 + React 18 SPA · react-router v6 · Supabase (Postgres + Auth + Edge Functions) · TanStack Query v5 · shadcn/ui · TipTap · Recharts · Sentry · vite-plugin-pwa · Deploy: Vercel (fra1)

---

## 1. Yapılan Düzeltmeler (Bu Oturum)

### ✅ TypeScript Hataları (12 hata → 0)

| Dosya | Hata | Çözüm |
|---|---|---|
| `PullToRefresh.tsx` | `e.touches[0]` undefined (TS2532) | Null check eklendi: `const touch = e.touches[0]; if (!touch) return;` |
| `SwipeNav.tsx` | `e.touches[0]` / `e.changedTouches[0]` undefined (TS2532) | Null check + `navigate(target)` tip güvenliği |
| `SwipeNav.tsx` | `availableRoutes[nextIndex]` undefined (TS2769) | `const target = availableRoutes[nextIndex]; if (target) navigate(target);` |
| `DreamJournal.tsx` | `setFormData` eksik `series_id` (TS2345) | 2 yerde `series_id: ''` eklendi |
| `DreamJournal.tsx` | `ai_analysis` tip uyumsuzluğu (TS2353) | `Record<string, unknown>` wrapper ile tip güvenli update |
| `DreamJournal.tsx` | `new Date(undefined)` (TS2769) | Fallback: `dream_date \|\| new Date().toISOString()` |

### ✅ ESLint Uyarısı (1 uyarı → 0)

| Dosya | Uyarı | Çözüm |
|---|---|---|
| `useAudioRecorder.ts` | `handleUpload` missing dependency | Fonksiyon sıralaması düzeltildi: `handleUpload` → `startRecording` |

### ✅ Performans İyileştirmeleri

#### Font Optimizasyonu (P1 çözüldü)
- **Önceki:** `@fontsource/inter/400.css` (tüm subset'ler: latin, latin-ext, cyrillic, greek, vietnamese)
- **Sonraki:** `@fontsource/inter/latin-400.css` + `latin-ext-400.css` (sadece Türkçe için gerekli)
- **Kazanç:** ~400 KB font dosyası kaldırıldı, `vendor.css` 37 KB → 4.78 KB
- **Etki:** LCP iyileşmesi (gereksiz font indirme yok), CSP kolaylaşması

#### PWA Manifest Temizliği
- Olmayan `pwa-screenshot-wide.png` ve `pwa-screenshot-narrow.png` referansları kaldırıldı
- `safari-pinned-tab.svg` referansı kaldırıldı (dosya yok)

### ✅ SEO İyileştirmeleri

#### `index.html` Meta Etiketleri
- `robots` meta: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
- `language` ve `revisit-after` meta eklendi
- `og:image:width` (1200) ve `og:image:height` (630) eklendi
- `og:site_name` eklendi
- **JSON-LD Structured Data:** `WebSite` + `SearchAction` (sitelinks search box rich result)

#### `robots.txt` Route Düzeltmeleri
- `/gunluk` → `/ruya-gunlugum` (gerçek route)
- `/favoriler` → `/favorilerim` (gerçek route)
- Eksik route'lar eklendi: `/ruya-gunlugum/sesli`, `/auth/callback`, `/email-dogrula`, `/abonelik-dogrula`, `/abonelik-iptal`

### ✅ Backend Güvenlik Düzeltmesi

#### `analyze-dream` Edge Function
- **Hata:** `VITE_HF_TOKEN` kullanılıyordu — `VITE_` prefix'li değişkenler Edge Function runtime'ında **kullanılamaz** (sadece build-time client bundle)
- **Çözüm:** `HF_TOKEN` (VITE_ prefix'siz) kullanıma alındı
- **Etki:** AI analiz özelliği artık production'da çalışacak

### ✅ H5 SEO Prerender Altyapısı (İçerik Client-rendered Sorunu)

SPA içerik sayfaları için build-time prerender altyapısı eklendi:

- Yeni dosya: `scripts/prerender.mjs`
- `package.json` build script'i güncellendi: `vite build && node scripts/prerender.mjs`
- Üretilen statik HTML yolları:
  - `dist/ruya/<slug>/index.html`
  - `dist/blog/<slug>/index.html`
  - `dist/kategori/<slug>/index.html`
  - `/ara`, `/populer`, `/kategoriler`, `/blog`, `/hakkimizda`, `/iletisim`
- Her prerender HTML çıktısına server-served SEO alanları enjekte edilir:
  - `<title>`
  - meta description
  - canonical
  - Open Graph
  - Twitter Card
  - JSON-LD (`Article`, `BlogPosting`, `CollectionPage`, `BreadcrumbList`)

**Doğrulama:** `npm run build` başarılı. Yerel ortamda anon/public key boş olduğu için script güvenli şekilde `SPA fallback` moduna düştü.

**Production gereksinimi:** Vercel Production env'de `VITE_SUPABASE_PUBLISHABLE_KEY` veya `SUPABASE_ANON_KEY` dolu olmalı. Bu değer tanımlanınca build sırasında içerik sayfaları otomatik statik HTML olarak üretilecek.

---

## 2. Mevcut Durum (Doğrulanan Metrikler)

### Sağlık Göstergeleri
| Kontrol | Durum |
|---|---|
| `npm run lint` (ESLint) | ✅ Temiz (0 hata, 0 uyarı) |
| `npm run typecheck` (tsc --noEmit) | ✅ Temiz (0 hata) |
| `npm run test` (Vitest) | ✅ 5/5 geçti |
| `npm run build` (Vite + prerender hook) | ✅ Başarılı (19.29s, yerelde key yok → SPA fallback) |
| `any` / `as any` kullanımı | ✅ 0 |
| `@ts-ignore` / `ts-expect-error` | ✅ 0 |

### Bundle Çıktısı (production build)
| Chunk | Boyut | Gzip | Not |
|---|---|---|---|
| `vendor` | 767 K | 250 K | Genel node_modules fallback |
| `charts-vendor` | 361 K | 89 K | Recharts + d3 (sadece admin) |
| `ui-vendor` | 231 K | 59 K | Radix + lucide + cmdk |
| `supabase-vendor` | 163 K | 42 K | Supabase JS |
| `editor-vendor` | 156 K | 45 K | TipTap (sadece admin) |
| `index` (eager) | 139 K | 38 K | Anasayfa girişi |
| `app-ui-vendor` | 55 K | 17 K | next-themes + sonner + cva |
| `motion-vendor` | 43 K | 15 K | Framer Motion |
| `DreamDetail` | 52 K | 15 K | Lazy |
| `vendor.css` | 4.8 K | 0.7 K | Font CSS (önceki: 37 K) |

**Toplam font dosyaları:** ~400 KB azaldı (gereksiz subset'ler kaldırıldı)

---

## 3. Tespit Edilen Kalıcı Sorunlar

### 🔴 Kritik

#### H5. İçerik sayfaları client-rendered — ✅ Altyapı çözüldü, env doğrulaması bekliyor
`/ruya/:slug`, blog postları ve kategori sayfaları için build-time prerender script'i eklendi. Production'da `VITE_SUPABASE_PUBLISHABLE_KEY` veya `SUPABASE_ANON_KEY` tanımlanınca Vercel build sırasında statik HTML dosyaları üretilecek.

**Kalan doğrulama:** Vercel Production env'de anon/public key değerinin dolu olduğu teyit edilmeli ve deploy sonrası örnek bir `/ruya/<slug>` URL'inin HTML kaynağında title/meta/JSON-LD görüldüğü kontrol edilmeli.

#### H6. RLS migration doğrulaması
`20260702182400_enable_rls_on_public_tables.sql` git'te tracked, ancak uzak Supabase'e uygulandığı doğrulanmalı.

**Doğrulama durumu:** Supabase CLI ile `npx supabase migration list` denendi ancak hesap yetkisi/DB password eksikliği nedeniyle `403` döndü. Bu nedenle iki doğrulama aracı eklendi:

- `supabase/rls_audit.sql`: Supabase SQL Editor veya doğrudan DB bağlantısında RLS açık mı ve policy listesi ne durumda gösterir.
- `npm run verify:rls`: anon/public key ile smoke test yapar; public read'lerin çalıştığını ve anon write denemelerinin RLS/policy ile engellendiğini doğrular.

**Çalıştırma:**

```bash
VITE_SUPABASE_URL=https://dagjpitlouekbnwdcpbz.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-or-publishable-key> \
npm run verify:rls
```

Tam remote migration doğrulaması için `SUPABASE_DB_PASSWORD` veya yeterli Supabase organization/project yetkisi gerekir.

### 🟠 Yüksek Öncelik

#### K1. Test kapsamı düşük
Sadece `site.test.ts` (5 test). Davranışsal regresyon koruması zayıf.

**Öneri:** `slug.ts`, `searchDreamsPage`, `auth-context`, `dreamContent` için unit test eklenmeli.

#### K3. Data layer sızıntısı
44 component/page `supabase.from(...)` çağrısını doğrudan yapıyor. TanStack Query + merkezi `queryKeys` var ama `queryFn`'ler dağınık.

**Öneri:** `src/lib/api/` typed query fonksiyonları ile kademeli taşıma.

#### K2. Devasa dosyalar
`Profile.tsx` (1266), `AnalyticsDashboard` (1002), `UnifiedDashboard` (919), `Popular` (902), `DreamDetail` (884), `Search` (862).

**Öneri:** Component bazlı bölme (her sekme/panel ayrı dosya).

### 🟡 Orta Öncelik

#### P2. İlk JS payload
Anasayfa eager: `vendor` 767K + `index` 139K + `ui-vendor` 231K + `supabase-vendor` 163K = ~1.3 MB.

**Öneri:** `vendor` chunk'ı daha granular bölünmeli (zod, react-hook-form, @hookform/resolvers ayrı chunk'lar).

#### H4. Hardcoded production URL
`robots.txt` sitemap URL'i hardcoded: `https://ruya-tabirleri.vercel.app/api/sitemap`

**Öneri:** Build sırasında `VITE_SITE_URL` env'den enjekte edilmeli.

---

## 4. Performans Analizi

### Web Vitals İzleme
Sentry entegrasyonu mevcut ve şu eşiklerde alarm üretiyor:
- LCP > 2500ms → warning
- TTFB > 800ms → warning
- CLS > 0.1 → warning
- INP > 200ms → warning

### Runtime Optimizasyonları (Mevcut)
- ✅ Code splitting (lazy routes)
- ✅ Manual chunks (vendor ayrıştırma)
- ✅ `requestIdleCallback` ile deferred global UI
- ✅ `content-visibility: auto` (off-screen render optimizasyonu)
- ✅ PWA service worker (runtime caching)
- ✅ Font self-hosting (Google Fonts bağımlılığı yok)
- ✅ `prefetch` ile popüler sayfa ön yükleme
- ✅ Image lazy loading (DOMPurify `loading` attr)
- ✅ Pull-to-refresh (mobil)
- ✅ Infinite scroll (opsiyonel)

### Kalan Performans Sorunları
1. **`vendor.js` (767 KB):** Çok büyük, daha granular bölünmeli
2. **Prerender production doğrulaması:** Vercel env key sonrası örnek içerik sayfaları kontrol edilmeli
3. **Font display:** `font-display: swap` CSS'te açıkça tanımlı değil

---

## 5. SEO Analizi

### Mevcut SEO Güçlü Yönleri
- ✅ `react-helmet-async` ile dinamik meta etiketleri
- ✅ Canonical URL her sayfada
- ✅ Open Graph + Twitter Card
- ✅ JSON-LD Structured Data (Article, BreadcrumbList, WebSite, SearchAction)
- ✅ Sitemap (Supabase Edge Function + Vercel API proxy)
- ✅ `robots.txt` (route bazlı disallow)
- ✅ Semantic HTML (`<main>`, skip link, ARIA)
- ✅ Türkçe lang attribute (`<html lang="tr">`)
- ✅ Accent-insensitive search (Türkçe karakter normalizasyonu)

### Kalan SEO Sorunları
1. **Prerender deploy doğrulaması:** Production build env key ile statik HTML üretimi teyit edilmeli
2. **Hardcoded sitemap URL (H4):** Özel alan adında sorun
3. **`Article` JSON-LD eksik alanlar:** `image`, `wordCount`, `thumbnailUrl` eklenebilir
4. **`FAQPage` JSON-LD yok:** Rüya tabiri sayfalarında SSS rich result fırsatı
5. **Internal linking:** Otomatize edilmiş ama `generate-internal-links` edge function cron ile çalışıyor mu doğrulanmalı

---

## 6. Yeni Özellik Önerileri

### 🚀 Yüksek Etki / Düşük Risk

#### 1. Rüya Sembolü Sözlüğü (`/semboller`)
- Her sembol için ayrı sayfa (yılan, su, uçmak, vb.)
- SEO: Long-tail anahtar kelimeler, internal linking
- İçerik: İslami + psikolojik + kültürel yorumlar
- **Etki:** SEO trafiği %30-40 artış potansiyeli

#### 2. Rüya SSS (FAQ) Sayfaları
- Her rüya tabiri sayfasında "Sıkça Sorulan Sorular" bölümü
- `FAQPage` JSON-LD ile rich result fırsatı
- **Etki:** SERP'te daha fazla yer kaplama, CTR artışı

#### 3. Rüya Takvimi / Ay Fazları
- Ay fazlarına göre rüya görme istatistikleri
- Kullanıcı günlüğünde ay fazı korelasyonu
- **Etki:** Kullanıcı engagement, geri dönüş oranı

#### 4. Rüya İstatistikleri Sayfası (`/istatistikler`)
- En çok görülen rüya türleri
- Aylık/trend grafikleri (Recharts zaten var)
- Kullanıcı bazlı "senin en çok gördüğün semboller"
- **Etki:** İçerik zenginleştirme, sosyal paylaşım

### 🎯 Orta Etki / Orta Risk

#### 5. Kişiselleştirilmiş Rüya Önerileri (`/senin-icin`)
- Favori/geçmiş bazlı collaborative filtering
- `generate-recommendations` edge function (cron)
- Anasayfada "Senin için rüyalar" bölümü
- **Etki:** Session süresi, sayfa görüntüleme artışı

#### 6. Rüya Yorum Topluluğu
- `dream_journal` herkese açık paylaşım (`/ruya-paylas/:id`)
- Threaded yorumlar + reaksiyonlar (emoji)
- Public liderlik tablosu (en çok paylaşan)
- **Etki:** UGC (user-generated content), SEO içerik artışı

#### 7. AI Rüya Matcher (Geliştirme)
- `dream-matcher` edge function zaten var
- "Benzer rüya gören kullanıcılar" özelliği
- Anonim eşleştirme + sembol korelasyonu
- **Etki:** Sosyal bağ, engagement

### 💡 Düşük Etki / Düşük Risk

#### 8. Rüya Günlüğü Export
- PDF/CSV export (mevcut `adminExport.ts` altyapısı var)
- Yıllık rüya özeti (AI ile)
- **Etki:** Kullanıcı değeri, retention

#### 9. Tarot / İ Ching Entegrasyonu
- Rüya ile bağlantılı mistik araçlar
- Günlük tarot kartı
- **Etki:** Yeni kullanıcı kitlesi, cross-sell

#### 10. Rüya Podcast / Sesli İçerik
- Popüler rüya tabirlerinin sesli okunması
- Web Speech API ile "dinle" özelliği (mevcut `useVoiceSearch` altyapısı)
- **Etki:** Erişilebilirlik, yeni içerik formatı

---

## 7. Öncelik Matrisi (Güncellenmiş)

| ID | Sorun/Öneri | Etki | Risk | Durum |
|---|---|---|---|---|
| TS | TypeScript hataları | 🔴 Kritik | Düşük | ✅ Çözüldü |
| LINT | ESLint uyarısı | 🟡 Düşük | Düşük | ✅ Çözüldü |
| FONT | Font optimizasyonu | 🟡 Orta | Düşük | ✅ Çözüldü |
| SEO-META | Meta etiketler + JSON-LD | 🟠 Yüksek | Düşük | ✅ Çözüldü |
| ROBOTS | robots.txt route düzeltme | 🟡 Orta | Düşük | ✅ Çözüldü |
| HF | Edge function env hatası | 🔴 Kritik | Düşük | ✅ Çözüldü |
| H5 | İçerik client-rendered | 🔴 Kritik (SEO) | Orta | ✅ Prerender altyapısı eklendi; prod env doğrulaması bekliyor |
| H6 | RLS doğrulama | 🔴 Kritik (güvenlik) | Düşük | 🟡 Doğrulama araçları eklendi; remote yetki/env bekliyor |
| K1 | Test kapsamı | 🟠 Yüksek | Düşük | ⏳ Bekliyor |
| K2 | Devasa dosyalar | 🟡 Orta | Düşük | ⏳ Bekliyor |
| K3 | Data layer sızıntısı | 🟠 Orta | Orta | ⏳ Bekliyor |
| P2 | İlk JS payload | 🟡 Orta | Düşük | ⏳ Bekliyor |
| H4 | Hardcoded URL | 🟠 Yüksek | Düşük | ⏳ Bekliyor |
| 1 | Rüya Sembolü Sözlüğü | 🟠 Yüksek (SEO) | Düşük | 💡 Öneri |
| 2 | Rüya SSS (FAQ) | 🟠 Yüksek (SEO) | Düşük | 💡 Öneri |
| 5 | Kişiselleştirme | 🟠 Yüksek | Orta | 💡 Öneri |

---

## 8. Sonraki Adımlar (Önerilen Sıra)

1. **H5 doğrulama:** Vercel Production env'de `VITE_SUPABASE_PUBLISHABLE_KEY` veya `SUPABASE_ANON_KEY` değerini doldur; deploy sonrası örnek `/ruya/<slug>` HTML kaynağını kontrol et
2. **H6:** `supabase/rls_audit.sql` veya `npm run verify:rls` ile uzak DB'de RLS durumunu doğrula
3. **H4:** `robots.txt` sitemap URL'ini build sırasında env'den enjekte et
4. **K1:** `slug.ts`, `dreamContent.ts`, `searchDreamsPage` için unit test ekle
5. **P2:** `vendor` chunk'ı böl (zod, react-hook-form ayrı)
6. **Öneri 1-2:** Rüya Sembolü Sözlüğü + FAQ sayfaları (SEO trafiği)

---

**Rapor Tarihi:** 2026-07-30
**Kontrol Komutu:** `npm run check` ✅ (lint + typecheck + test tümü temiz)
**Build Durumu:** `npm run build` ✅ (19.29s, 0 hata; yerelde anon key boş olduğu için prerender SPA fallback'e düştü)