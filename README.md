# Rüya Tabirleri — Mistik Günlük

Türkçe rüya tabirleri web uygulaması: binlerce rüya yorumu, İslami ve psikolojik
yorumlar, arama, rüya günlüğü, blog ve PWA desteği.

## Teknoloji Yığını

- **Build:** Vite 5 (`@vitejs/plugin-react-swc`)
- **Frontend:** React 18 (SPA) + TypeScript (strict) + react-router v6
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Veri:** Supabase (Postgres + Auth + Storage + Edge Functions) · TanStack Query v5
- **Form/Doğrulama:** react-hook-form + zod
- **Editör:** TipTap (admin blog/rüya formları)
- **Grafik:** Recharts (admin analitiği)
- **SEO:** react-helmet-async
- **PWA:** vite-plugin-pwa (Workbox)
- **İzleme:** Sentry (hatalar + performans + session replay)
- **Deploy:** Vercel (region `fra1`)

## Geliştirme

```sh
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu (http://localhost:8080)
npm run dev

# Tip kontrolü + lint
npm run check        # = npm run lint && npm run typecheck

# Production build (dist/)
npm run build

# Bundle analizini gör (dist/stats.html)
npm run analyze

# Production preview
npm run preview
```

### Ortam Değişkenleri

`.env.local` içinde (örnek için `.env.example`):

| Değişken | Açıklama |
|---|---|
| `VITE_SUPABASE_URL` | Supabase proje URL'i |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon public key |
| `VITE_SITE_URL` | Production domain (canonical/OG için) |
| `VITE_SENTRY_DSN` | Sentry DSN (opsiyonel) |
| `VITE_APP_VERSION` | Sürüm etiketi (Sentry release) |
| `VITE_GOOGLE_MAPS_EMBED_KEY` | Google Maps Embed API anahtarı (opsiyonel — boşsa iletişim haritası anahtarsız embed'e düşer). Referrer kısıtlaması önerilir. |

Supabase Edge Functions secret'ları için `SUPABASE_SETUP.md`'ye bakın.

## Mimari Notları

- **Routing:** `src/App.tsx` — `Index` ve `NotFound` eager, diğer tüm sayfalar `lazy()` ile code-split.
- **Veri katmanı:** Supabase istemcisi `src/integrations/supabase/client.ts`; sorgular genelde
  TanStack Query hook'ları içinde, merkezi `queryKeys` (`src/lib/query/client.ts`).
- **Auth:** `src/contexts/AuthProvider.tsx` (Supabase Auth, rol bazlı: admin/moderator/user).
- **Backend:** `supabase/migrations/` (SQL migration'ları), `supabase/functions/` (Deno Edge Functions).
- **Deploy:** `.github/workflows/vercel-deploy.yml` → `main` push'unda lint+typecheck, sonra Vercel prod build.

## Daha Fazla Bilgi

- **Denetim/iyileştirme planı:** `DENETIM_RAPORU_YYYY-MM.md`
- **Supabase kurulumu:** `SUPABASE_SETUP.md`
- **Deploy adımları:** `DEPLOY_CHECKLIST.md`
