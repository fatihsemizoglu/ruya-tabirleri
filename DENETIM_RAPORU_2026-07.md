# Rüya Tabirleri — Kapsamlı Denetim Raporu

**Tarih:** 2026-07-04
**Kapsam:** Performans, kod kalitesi, hata denetimi + yeni özellik önerileri
**Stack:** Vite 5 + React 18 SPA · react-router v6 · Supabase (Postgres + Auth + Edge Functions) · TanStack Query v5 · shadcn/ui · TipTap · Recharts · Sentry · vite-plugin-pwa · Deploy: Vercel (fra1)

---

## 1. Mevcut Durum (Doğrulanan Metrikler)

### Sağlık Göstergeleri
| Kontrol | Durum |
|---|---|
| `npm run lint` (ESLint) | ✅ Temiz |
| `npm run typecheck` (tsc --noEmit) | ✅ Temiz |
| `any` / `as any` kullanımı | ✅ 0 |
| `@ts-ignore` / `ts-expect-error` | ✅ 0 |
| `TODO` / `FIXME` / `HACK` | ✅ 0 (ama bkz. Search.tsx no-op bloklar) |
| Test altyapısı | ❌ Yok (unit & E2E) |

### Bundle Çıktısı (production build, `dist/assets` = 3.1 MB)
| Chunk | Boyut | Not |
|---|---|---|
| `vendor` | 724 K | Genel (react, vb.) |
| `charts-vendor` | 356 K | Recharts + d3 (admin) |
| `ui-vendor` | 224 K | Radix + lucide + cmdk |
| `supabase-vendor` | 160 K | Supabase JS |
| `editor-vendor` | 152 K | TipTap (admin) |
| `index` (eager) | 129 K | Anasayfa girişi |
| `DreamDetail` | 51 K | Lazy |
| `Profile` | 49 K | Lazy |

Manual chunks iyi bölünmüş; admin-ağırlıklı paketler (charts/editor) doğru şekilde ayrılmış.

### En Büyük Kaynak Dosyalar (satır)
`Profile.tsx` 1266 · `AnalyticsDashboard` 1002 · `UnifiedDashboard` 919 · `Popular` 902 · `DreamDetail` 878 · `Search` 862 · `Favorites` 850 · `GamificationPanel` 819 · `Header` 808 · `CategoryDetail` 788.

---

## 2. Tespit Edilen Sorunlar

### 🔴 Hata / Doğruluk (Kritik)

#### H1. Production'da sessiz hata yutma — EN KRİTİK BULGU
`vite.config.ts` → `esbuild.drop: ['console', 'debugger']` (production modunda).
Kod tabanında **72 adet** `catch (error) { console.error(...) }` kalıbı var.
Bunların tümü production bundle'ında **çıkarılır** → catch blokları fiilen boş çalışır.
**Sonuç:** Üretimde oluşan hataların hiçbiri Sentry'ye ulaşmaz; sessizce yutulur. Regresyonları saptamak imkânsız.

#### H2. `Search.tsx` no-op filtreler (kullanıcı yanıltma)
- **"Öne çıkanlar" filtresi** (L296-299): Boş blok + `// Note: search_dreams doesn't return is_featured` yorumu. Hiçbir şey filtreleme­mez.
- **"En yeni" sıralaması** (L324-326): RPC `created_at` döndürmediği için "orijinal sırayı koru" yorumuyla no-op.
UI bu filtreleri aktif gibi gösteriyor ama etki sıfır.

#### H3. `interpret-dream` edge function boş
`supabase/functions/interpret-dream/` dizini tamamen boş (kaynak yok). `/api/interpret-dream` rewrite mevcut ama fonksiyon deploy edilmemiş/uygulanmamış.

#### H4. Hardcoded production URL
- `index.html` (canonical, og:url, twitter:url) → `https://ruya-tabirleri.vercel.app/`
- `public/robots.txt` → `Sitemap: https://ruya-tabirleri.vercel.app/api/sitemap`
- `src/lib/site.ts` → `VITE_SITE_URL` destekliyor ama HTML statik olduğu için env devre dışı.
Özel alan adı eklenince duplicate-canonical / yanlış sitemap riski.

#### H5. İçerik sayfaları tamamen client-rendered
`/ruya/:slug`, blog postları, kategori sayfaları → tamamen istemci taraflı render. `react-helmet-async` meta etiketlerini yalnızca JS çalıştıran tarayıcılarda efektle yerleştirir. SEO odaklı içerik sitesi için en büyük performans/SEO darbesi.

#### H6. RLS migration beklemede
`supabase/migrations/20260702182400_enable_rls_on_public_tables.sql` git'te tracked (yeni, commit dışı), ancak uzak Supabase'e **uygulanıp uygulanmadığı doğrulanmalı**. Açık RLS = anon key üzerinden serbest yazım riski.

---

### 🟠 Kod Kalitesi

#### K1. Sıfır test
Hiçbir test yok (unit yok, E2E yok). Tek kalite kapısı `npm run check` (lint + typecheck). Davranışsal regresyon koruması yok.

#### K2. Devasa dosyalar
10+ dosya 800-1266 satır. `Profile.tsx` (1266), `Popular.tsx` (902), `DreamDetail.tsx` (878) başlıçları. Bakım, kod inceleme ve code-splitting maliyetini artırıyor.

#### K3. Data layer sızıntısı
44 component/page, `supabase.from(...)` çağrısını doğrudan yapıyor. Yoğun dosyalar:
`AnalyticsDashboard` 20 · `UnifiedDashboard` 16 · `GamificationPanel` 16 · `DreamDetail` 12 · `Profile` 11.
TanStack Query + merkezi `queryKeys` var ama `queryFn`'ler dağınık; sorgu mantığı yeniden kullanılmıyor, cache invalidation tutarsız.

#### K4. Kök dizin kalıntıları
- **12 eski rapor .md** (`BACKEND_DENETIM_RAPORU_*`, `FRONTEND_*`, `HATA_*`, `OZET_RAPOR.md`, `PROJECT_ANALYSIS_REPORT.md`, `REFACTORING_GUIDE.md`, `SUPABASE_*` vb.)
- **16 screenshot .png** (toplam ~3.7 MB; `screenshot-local-categories.png` tek başına 2.3 MB)
- **İki lockfile**: `package-lock.json` + `bun.lockb` (CI npm kullanıyor → `bun.lockb` ölü)
- `README.md` eski Lovable boilerplate; gerçek Vercel/Supabase kurulumunu yansıtmıyor.

#### K5. `tsconfig.json` çakışması
Kök `tsconfig.json` gevşek, `tsconfig.app.json` strict. `tsc -b` app'i kullanıyor ama IDE/editor hangisini seçeceği konusunda tutarsız olabilir.

---

### 🟡 Performans

#### P1. Google Fonts yükü
`index.html` iki aile (Inter + Plus Jakarta Sans) × 8 ağırlık yükler. `media=print` + `onload` hilesi iyi ama yine de yüksek payload + üçüncü taraf bağlantısı. Self-host/subset (latin-ext) ile LCP iyileşir, CSP kolaylaşır.

#### P2. İlk JS payload
Anasayfa eager: `vendor` 724K + `index` 129K + `ui-vendor` 224K + `supabase-vendor` 160K. Anasayfa için kritik olmayan importlar dynamic'e çekilebilir (H5'teki prerender sonrası `react-helmet-async` runtime'da azalır).

#### P3. Recharts doğru yerde
Recharts 356K admin chunk'ında izole — ✅ doğru. Anasayfada chart olmadığı doğrulandı.

---

## 3. Yol Haritası — 5 Faz

### FAZ 0 — Denetim Raporu + Kök Temizliği ✍️
- [x] Bu rapor
- [x] Eski `*_RAPOR*`, `screenshot-*.png` → sil + `.gitignore` (8 dosya git'ten kaldırıldı, screenshot'lar diskten silindi)
- [x] `bun.lockb` kaldır (CI npm kullanıyor)
- [x] `README.md` gerçek stack'e güncelle
- [x] `.gitignore` desenleri güçlendirildi (kök seviyesi `/` kilitli, eski rapor desenleri)

### FAZ 1 — Hata Düzeltmeleri 🐛
1. **Sentry/error standardizasyonu** (H1): `src/lib/errorReport.ts` (`captureError` yardımcısı). Tüm catch bloklarını buna geçir. `esbuild.drop`'u `['debugger']`'a indir.
2. **Search.tsx filtre onarımı** (H2): `search_dreams` RPC'sine `is_featured` + `created_at` ekle (migration) veya filtreleri disabled+etiketle.
3. **Hardcoded URL → env** (H4): `index.html` + `robots.txt` build'de `VITE_SITE_URL`'den enjekte.
4. **RLS doğrulama** (H6): migration'ın uzak DB'de uygulandığını teyit et.
5. **tsconfig birleştirme** (K5).

### FAZ 2 — Kod Kalitesi & Test 🧪
1. Vitest + Testing Library + jsdom; ilk testler: `slug.ts`, `site.ts`, `searchDreamsPage` fallback, `auth-context`.
2. Playwright E2E: anasayfa, arama, rüya detayı, admin koruması.
3. Data layer: `src/lib/api/` typed query fonksiyonları; 44 doğrudan çağrı kademeli taşıma.
4. Devasa dosyaları bölme (`Profile`, `Popular`, `DreamDetail`, `Search`).
5. ESLint `no-console` (yardımcı hariç) + `exhaustive-deps` temizliği.

### FAZ 3 — Performans & Prerender ⚡
1. **Prerender (tüm içerik sayfaları)**: `vite-plugin-prerender` (Puppeteer). Build öncesi Supabase'den tüm slug'ları çek; on-demand prerender (`api/prerender.ts`) ile 1000+ sayfa için ISR benzeri cache.
2. **Font self-host**: `@fontsource/inter` latin-ext; `index.html`'den Google Fonts link'i kaldır.
3. **İlk bundle diyeti**: anasayfa eager import taraması; dynamic import'lar.
4. **Image optimization**: og-image + PWA ikonları.
5. **WebVitals eşikleri** (LCP<2.5s, INP<200ms) → Sentry regresyon alarmları.

### FAZ 4 — Yeni Özellikler 🚀
- **4A. Kişiselleştirme/Öneri**: `/senin-icin` + anasayfa "Senin için rüyalar"; favori/geçmiş bazlı collaborative filtering; günlük kişisel kart; `generate-recommendations` edge function (cron).
- **4B. Topluluk/Sosyal**: `dream_journal` herkese açık paylaşım (`/ruya-paylas/:id`); threaded yorumlar + reaksiyonlar; public liderlik tablosu; herkese açık kullanıcı profilleri.
- **4C. İçerik/SEO Araçları (Admin)**: `draft-dream-from-keyword` AI; internal-linking editör entegrasyonu; "şunu arayanlar bunları da aradı" modülü; `Article` + `FAQPage` + breadcrumb JSON-LD; SEO sağlık paneli.

---

## 4. Öncelik Matrisi

| ID | Sorun | Etki | Risk | Faz |
|---|---|---|---|---|
| H1 | Prod'da sessiz hata yutma | 🔴 Kritik (gözlemlenebilirlik) | Düşük | 1.1 |
| H2 | Search no-op filtreler | 🔴 Yüksek (kullanıcı yanıltma) | Düşük | 1.2 |
| H5 | İçerik client-rendered | 🔴 Kritik (SEO) | Orta | 3 |
| H6 | RLS migration beklemede | 🔴 Kritik (güvenlik) | Düşük | 1.4 |
| H4 | Hardcoded URL | 🟠 Yüksek (alan adı) | Düşük | 1.3 |
| K1 | Test yok | 🟠 Yüksek (regresyon) | Düşük | 2 |
| K3 | Data layer sızıntısı | 🟠 Orta (bakım) | Orta | 2 |
| K2 | Devasa dosyalar | 🟡 Orta | Düşük | 2 |
| P1 | Font payload | 🟡 Orta (LCP) | Düşük | 3 |
| P2 | İlk JS payload | 🟡 Orta | Düşük | 3 |

---

## 5. İlerleme Takibi

Her faz sonunda `npm run check` + `npm run build` (Faz 2'den itibaren `npm run test`) çalıştırılır. Her madde ayrı commit. Faz geçişi önce kullanıcı onayı ile.

**Mevcut durum:** Faz 0 raporu tamamlandı → Kök temizliğine geçiliyor.
