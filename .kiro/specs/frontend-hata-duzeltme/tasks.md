# Implementation Plan: Frontend Hata Düzeltme

## Overview

15 frontend hatasını kritiklik ve bağımlılık sırasına göre uygula. Her grup kendi içinde bağımsız olup önceki grubun tamamlanmasına bağlıdır. Tüm değişiklikler TypeScript + React 18 + Vite projesinde yapılacaktır.

---

## Tasks

- [ ] 1. KRİTİK: Mimari ve Güvenlik Düzeltmeleri (Grup 1)
  - [ ] 1.1 `useAuth.tsx` dosyasını sil ve import'ları doğrula
    - `src/hooks/useAuth.tsx` dosyasını sil
    - `grep -r "from '@/hooks/useAuth'" src/` komutuyla tüm import'ların `useAuth.ts`'e çözümlendiğini doğrula
    - `useAuth.ts` zaten `src/contexts/auth-context.ts`'deki merkezi context'i kullanıyor, değişiklik gerekmez
    - _Gereksinim: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Fix 1 için unit test yaz
    - `useAuth` import edenildiğinde `src/hooks/useAuth.tsx` dosyasının hiçbir yerden resolve edilmediğini doğrula
    - TypeScript derleme çıktısında hata olmadığını test et
    - _Gereksinim: 1.5_

  - [ ] 1.3 `dompurify` bağımlılığını ekle ve BlogPost.tsx'de XSS fix uygula
    - `npm install dompurify` ve `npm install -D @types/dompurify` komutlarını çalıştır
    - `src/pages/BlogPost.tsx` dosyasını aç, dosya başına `import DOMPurify from 'dompurify';` ekle
    - `dangerouslySetInnerHTML={{ __html: post.content }}` satırını şu şekilde değiştir:
      ```tsx
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, {
        ALLOWED_TAGS: ['p','br','strong','em','u','s','h1','h2','h3','h4','h5','h6',
          'ul','ol','li','blockquote','code','pre','a','img',
          'table','thead','tbody','tr','th','td','hr','figure','figcaption'],
        ALLOWED_ATTR: ['href','src','alt','class','target','rel','loading'],
        FORBID_TAGS: ['script','style','iframe'],
        FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
      }) }}
      ```
    - `npx tsc --noEmit` ile TypeScript hatası olmadığını doğrula
    - Test komutu: `npx vitest --run`
    - _Gereksinim: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.4 Property 1 — DOMPurify XSS sanitizasyonu için property test yaz
    - `src/__tests__/dompurify.test.ts` dosyasını oluştur
    - `npm install -D fast-check vitest @testing-library/react @testing-library/user-event jsdom` komutunu çalıştır
    - `vitest.config.ts` yoksa oluştur; `environment: 'jsdom'` ayarla
    - `fast-check` ile 200 iterasyonluk property test: herhangi bir string payload, `<script>` tag ve `onerror=` attribute içermemeli
    - Test komutu: `npx vitest --run src/__tests__/dompurify.test.ts`
    - **Property 1: DOMPurify XSS temizleme**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.5 Property 2 — Sanitizasyon güvenli içeriği korur için property test yaz
    - Aynı test dosyasına ekle
    - İzin verilen tag'lerden oluşan HTML için sanitize sonrası text içeriğinin aynı kalmasını doğrula
    - Test komutu: `npx vitest --run src/__tests__/dompurify.test.ts`
    - **Property 2: Güvenli içerik korunması**
    - **Validates: Requirements 2.3**

  - [ ] 1.6 `AuthProvider.tsx`'de race condition fix uygula
    - `src/contexts/AuthProvider.tsx` dosyasını aç
    - `import { useState, useEffect, ReactNode } from 'react'` satırına `useRef` ekle
    - `initializedRef` ve `currentUserIdRef` ref'lerini ekle:
      ```typescript
      const initializedRef = useRef(false);
      const currentUserIdRef = useRef<string | null>(null);
      ```
    - `useEffect` içinde **önce** `onAuthStateChange` listener'ını kur, **sonra** `getSession` çağır
    - `onAuthStateChange` callback'inde: `currentUserIdRef.current !== session.user.id` koşuluyla sadece yeni userId için fetch yap
    - `getSession` then callback'inde: aynı koşulla duplicate fetch'i engelle
    - `setTimeout(..., 0)` anti-pattern kaldır (bu dosyada yoksa sadece doğrula)
    - Test komutu: `npx vitest --run`
    - _Gereksinim: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 1.7 Property 4 — AuthProvider duplicate fetch engellenir için property test yaz
    - `src/__tests__/authProvider.test.ts` dosyasını oluştur
    - Aynı userId ile hem `getSession` hem `onAuthStateChange` event'i geldiğinde `fetchProfile` ve `fetchRoles`'un en fazla bir kez çağrıldığını doğrula
    - Test komutu: `npx vitest --run src/__tests__/authProvider.test.ts`
    - **Property 4: AuthProvider duplicate fetch engellenir**
    - **Validates: Requirements 7.2, 7.3**

- [ ] 2. Checkpoint — Kritik güvenlik/mimari düzeltmeleri tamamlandı
  - Tüm testlerin geçtiğini doğrula, hata varsa kullanıcıya sor.

- [ ] 3. ÖNEMLİ: Yüklenme ve Routing Düzeltmeleri (Grup 2)
  - [ ] 3.1 BlogPost.tsx'e `finally` bloğu ekle ve `useCallback` ile sar
    - `src/pages/BlogPost.tsx` dosyasını aç
    - `import { useState, useEffect } from 'react'` satırına `useCallback` ekle
    - `fetchPost` fonksiyonunu `useCallback` ile sar, deps: `[slug, navigate]`
    - Fonksiyon içine `let isMounted = true;` ekle
    - `setIsLoading(false)` çağrısını `finally { if (isMounted) setIsLoading(false); }` bloğuna taşı
    - `if (error || !data)` branch'ine navigate çağrısı zaten var, bunu try içinde bırak
    - `useEffect`'teki `// eslint-disable-next-line` yorumunu kaldır; dep array'e `fetchPost` ekle
    - `checkIfLiked` fonksiyonunu `useCallback` ile sar, deps: `[post, user]`
    - Cleanup: return `() => { isMounted = false; }`
    - _Gereksinim: 8.1, 8.2, 8.3, 8.4, 3.2_

  - [ ] 3.2 `src/App.tsx`'de BrowserRouter sıralamasını düzelt
    - `src/App.tsx` dosyasını aç
    - Mevcut sıralama: `QueryClientProvider > AuthProvider > TooltipProvider > BrowserRouter > ...`
    - Hedef sıralama: `QueryClientProvider > BrowserRouter > AuthProvider > TooltipProvider > ...`
    - `BrowserRouter` ile `AuthProvider` wrapper'larını yerinden çıkarıp doğru sıraya koy:
      ```tsx
      const App = () => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <OfflineIndicator />
                <CommandPalette />
                <OnboardingTour />
                <InstallPrompt />
                <AnimatedRoutes />
              </TooltipProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );
      ```
    - `npx tsc --noEmit` ile TypeScript hatası olmadığını doğrula
    - _Gereksinim: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 3.3 `src/integrations/supabase/client.ts`'e env validation ekle
    - `src/integrations/supabase/client.ts` dosyasını aç
    - `createClient` çağrısından önce validation bloğunu ekle:
      ```typescript
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

      if (!SUPABASE_URL || SUPABASE_URL.trim() === '') {
        throw new Error('VITE_SUPABASE_URL ortam değişkeni tanımlı değil.');
      }
      if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.trim() === '') {
        throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY ortam değişkeni tanımlı değil.');
      }
      ```
    - Mevcut `const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;` satırlarını yeni tanımlarla değiştir
    - _Gereksinim: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 3.4 Property 5 — Env validation için property test yaz
    - `src/__tests__/supabaseEnv.test.ts` dosyasını oluştur
    - `validateSupabaseEnv` adında extract edilmiş bir fonksiyon ya da module-level validation mantığını test et
    - `undefined`, `''`, `'  '` değerleri için `throw Error` beklentisi doğrula
    - `fast-check` ile `fc.oneof(fc.constant(''), fc.constant('  '), fc.constant(undefined))` kombinasyonu
    - Test komutu: `npx vitest --run src/__tests__/supabaseEnv.test.ts`
    - **Property 5: Env validation her falsy değeri reddeder**
    - **Validates: Requirements 11.1, 11.3**

  - [ ] 3.5 `src/App.tsx`'de duplicate route'u `<Navigate>` ile düzelt
    - `src/App.tsx` dosyasını aç, `Navigate` import'u ekle: `import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";`
    - `<Route path="/ruya-tabirleri" element={<Popular />} />` satırını şu şekilde değiştir:
      ```tsx
      <Route path="/ruya-tabirleri" element={<Navigate replace to="/populer" />} />
      ```
    - `/populer` route'u değişmeden kalır
    - _Gereksinim: 12.1, 12.2, 12.3, 12.4_

- [ ] 4. Checkpoint — Routing, yüklenme ve env düzeltmeleri tamamlandı
  - Tüm testlerin geçtiğini doğrula, hata varsa kullanıcıya sor.

- [ ] 5. ORTA: React Query Migrasyonları (Grup 3)
  - [ ] 5.1 `src/hooks/useSiteSettings.ts`'i React Query'e migrate et
    - `src/hooks/useSiteSettings.ts` dosyasını aç
    - `import { useEffect, useState } from 'react'` satırını `import { useQuery, useQueryClient } from '@tanstack/react-query'` ile değiştir
    - Module-level `let cache` ve `CACHE_TTL` değişkenlerini tamamen sil
    - `useSiteSettings` fonksiyonunu şu yapıya dönüştür:
      ```typescript
      const SITE_SETTINGS_QUERY_KEY = ['site-settings'] as const;
      const STALE_60_SEC = 60_000;

      export function useSiteSettings() {
        const { data: settings = defaults, isLoading: loading } = useQuery({
          queryKey: SITE_SETTINGS_QUERY_KEY,
          queryFn: async (): Promise<SiteSettings> => {
            const { data, error } = await supabase.from('site_settings').select('key, value');
            if (error) throw error;
            const merged: SiteSettings = { ...defaults };
            data?.forEach((row: { key: string; value: unknown }) => {
              if (row.key in merged && row.value !== null && row.value !== undefined) {
                (merged as unknown as Record<string, unknown>)[row.key] = row.value as string;
              }
            });
            return merged;
          },
          staleTime: STALE_60_SEC,
        });
        return { settings, loading };
      }
      ```
    - `invalidateSiteSettingsCache` fonksiyonunu `useInvalidateSiteSettings` hook'una dönüştür:
      ```typescript
      export function useInvalidateSiteSettings() {
        const queryClient = useQueryClient();
        return () => queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
      }
      export function invalidateSiteSettingsCache() {
        console.warn('invalidateSiteSettingsCache deprecated — use useInvalidateSiteSettings()');
      }
      ```
    - _Gereksinim: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 5.2 `src/components/layout/Header.tsx`'i React Query'e migrate et
    - `src/components/layout/Header.tsx` dosyasını aç
    - `useQuery` import ekle: `import { useQuery } from '@tanstack/react-query';`
    - `const [categories, setCategories]`, `const [blogCategories, setBlogCategories]`, `const [recentPosts, setRecentPosts]` useState'leri ve `fetchAll` useEffect'ini tamamen kaldır
    - Üç ayrı `useQuery` hook'u ekle (her biri `staleTime: 5 * 60 * 1000`):
      - `queryKey: ['header-dream-categories']` — categories
      - `queryKey: ['header-blog-categories']` — blogCategories  
      - `queryKey: ['header-recent-posts']` — recentPosts
    - Her query için hata durumunda empty array fallback (`data ?? []` kullan)
    - `npx tsc --noEmit` ile TypeScript hatası olmadığını doğrula
    - _Gereksinim: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 5.3 `vite.config.ts`'e production console drop konfigürasyonu ekle
    - `vite.config.ts` dosyasını aç
    - `defineConfig(({ mode }) => ({...}))` zaten mevcut; `esbuild` bloğunu ekle:
      ```typescript
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      ```
    - `src/lib/logger.ts` dosyasını oluştur:
      ```typescript
      const isDev = import.meta.env.DEV;
      export const logger = {
        error: isDev ? console.error.bind(console) : () => {},
        warn: isDev ? console.warn.bind(console) : () => {},
        info: isDev ? console.info.bind(console) : () => {},
      };
      ```
    - `npx vite build` ile production build'in hata vermediğini doğrula
    - _Gereksinim: 13.1, 13.2, 13.3, 13.4_

- [ ] 6. Checkpoint — React Query migrasyonları ve Vite config tamamlandı
  - Tüm testlerin geçtiğini doğrula, hata varsa kullanıcıya sor.

- [ ] 7. ORTA: useCallback Migrasyonları (Grup 4)
  - [ ] 7.1 `src/pages/DreamDetail.tsx`'de useCallback migration uygula
    - `src/pages/DreamDetail.tsx` dosyasını aç
    - `fetchDream` fonksiyonunu `useCallback` ile sar, deps: `[slug, user]`
    - `fetchDream`'i fonksiyon tanımından önce return içine taşı (yukarıya kaldır)
    - `useEffect`'teki `// eslint-disable-next-line` yorumunu kaldır; dep array'e `fetchDream` ekle
    - `fetchComments` zaten `useCallback` ile sarılı (dosyada mevcut), doğrula
    - _Gereksinim: 3.1_

  - [ ] 7.2 `src/pages/Search.tsx`'de useCallback migration uygula
    - `src/pages/Search.tsx` dosyasını aç
    - `import { useState, useEffect, useMemo, useRef } from 'react'` satırına `useCallback` ekle
    - `performSearch` fonksiyonunu `useCallback` ile sar, deps: `[]` (searchTerm parametre olarak alınır)
    - `fetchRelatedDreams` fonksiyonunu `useCallback` ile sar, deps: `[]`
    - Her iki `useEffect`'teki `// eslint-disable-next-line` yorumlarını kaldır
    - `performSearch` useEffect deps: `[query, performSearch]`
    - _Gereksinim: 3.3_

  - [ ] 7.3 Diğer sayfalarda useCallback migration uygula
    - `src/pages/CategoryDetail.tsx` — `fetchData`: deps `[slug]`
    - `src/pages/Popular.tsx` — `fetchDreams`: deps `[]`
    - `src/pages/Favorites.tsx` — `fetchFavorites`: deps `[user]`
    - `src/pages/History.tsx` — `fetchHistory`: deps `[user]`
    - `src/pages/DreamJournal.tsx` — `fetchJournalEntries`: deps `[user]`
    - `src/pages/Profile.tsx` — `fetchProfile`: deps `[user]`
    - `src/pages/Blog.tsx` — `fetchPosts`: deps `[]`
    - Her dosyada: `useCallback` import ekle, fonksiyonu sar, eslint-disable yorumlarını kaldır, useEffect dep'e ekle
    - _Gereksinim: 3.4, 3.5_

  - [ ]* 7.4 useCallback migration için lint doğrulaması yap
    - `npx eslint src/pages/ --rule '{"react-hooks/exhaustive-deps": "error"}'` komutunu çalıştır
    - Tüm dosyalarda sıfır `react-hooks/exhaustive-deps` ihlali olduğunu doğrula
    - _Gereksinim: 3.5_

- [ ] 8. Checkpoint — useCallback migrasyonları tamamlandı
  - Tüm testlerin geçtiğini doğrula, hata varsa kullanıcıya sor.

- [ ] 9. DÜŞÜK: UI/UX ve Erişilebilirlik Düzeltmeleri (Grup 5)
  - [ ] 9.1 `src/components/admin/RichTextEditor.tsx`'de Radix Dialog ile window.prompt'u değiştir
    - `src/components/admin/RichTextEditor.tsx` dosyasını aç
    - `import * as Dialog from '@radix-ui/react-dialog';` ekle (zaten proje bağımlılığında mevcut)
    - `import { Input } from '@/components/ui/input';` ekle
    - `interface ToolbarButtonProps` içine `'aria-label'?: string;` ekle; button'a `aria-label={props['aria-label'] || props.title}` ilet
    - `DialogState` interface'i ve `dialog` state'i ekle:
      ```typescript
      interface DialogState { type: 'link' | 'image' | null; value: string; }
      const [dialog, setDialog] = useState<DialogState>({ type: null, value: '' });
      ```
    - `setLink` useCallback'ini şu şekilde değiştir (window.prompt kaldır):
      ```typescript
      const openLinkDialog = useCallback(() => {
        if (!editor) return;
        setDialog({ type: 'link', value: editor.getAttributes('link').href || '' });
      }, [editor]);
      ```
    - `addImage` useCallback'ini şu şekilde değiştir:
      ```typescript
      const openImageDialog = useCallback(() => {
        if (!editor) return;
        setDialog({ type: 'image', value: '' });
      }, [editor]);
      ```
    - `handleDialogConfirm` useCallback'i ekle (design doc'taki implementasyon)
    - Toolbar butonlarındaki `onClick={setLink}` → `onClick={openLinkDialog}`, `onClick={addImage}` → `onClick={openImageDialog}` yap
    - Her ToolbarButton'a `aria-label` ekle (örn: `aria-label="Kalın"`)
    - Return JSX'in sonuna Radix Dialog bileşenini ekle (design doc'taki implementasyon)
    - _Gereksinim: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.6_

  - [ ] 9.2 `src/pages/Search.tsx`'de server-side pagination uygula
    - `src/pages/Search.tsx` dosyasını aç
    - `const [totalCount, setTotalCount] = useState(0);` ekle
    - `performSearch` fonksiyonunu server-side pagination'a göre güncelle:
      - `limit_count: 10000` → `limit_count: RESULTS_PER_PAGE` (24)
      - `offset_count: (page - 1) * RESULTS_PER_PAGE` parametresi ekle
      - Hafif count query ekle: `supabase.from('dreams').select('id', { count: 'exact', head: true }).eq('is_published', true).textSearch('title', searchTerm)`
      - `setTotalCount(count || 0)` çağır
    - `paginatedResults` useMemo'yu kaldır — `results` direkt sayfa verisi
    - `totalPages` hesabını `Math.ceil(totalCount / RESULTS_PER_PAGE)` yap
    - Pagination butonlarında `performSearch(query, currentPage - 1)` / `performSearch(query, currentPage + 1)` çağır
    - **NOT:** `search_dreams` RPC'ye `offset_count` parametresi henüz eklenmemişse Supabase migration gereklidir (Gereksinim 6.6) — migration SQL'i design doc'ta mevcuttur
    - _Gereksinim: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.3 Property 3 — Sayfalama offset formülü için property test yaz
    - `src/__tests__/pagination.test.ts` dosyasını oluştur
    - `fast-check` ile `fc.integer({ min: 1, max: 1000 })` ve `fc.integer({ min: 1, max: 100 })` kombinasyonu
    - `offset === (page - 1) * resultsPerPage` ve `offset >= 0` koşullarını 500 iterasyonla doğrula
    - Test komutu: `npx vitest --run src/__tests__/pagination.test.ts`
    - **Property 3: Sayfalama offset formülü doğrudur**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 9.4 Erişilebilirlik (A11y) düzeltmelerini uygula
    - **Header (`src/components/layout/Header.tsx`):**
      - Navigasyon linklerine `aria-current={isActiveLink(path) ? 'page' : undefined}` ekle (Anasayfa, Popüler Rüyalar, İletişim linkleri)
      - Kategori dropdown butonu `aria-expanded={openCategoryMenu}` zaten mevcut, doğrula
      - Blog mega-menu butonu `aria-expanded={openBlogMega}` zaten mevcut, doğrula
    - **SearchAutocomplete (`src/components/search/SearchAutocomplete.tsx`):**
      - Dropdown container div'ine `role="listbox"` ve `id="search-suggestions"` ve `aria-label="Arama önerileri"` ekle
      - Her suggestion button'a `role="option"` ve `aria-selected={selectedIndex === index}` ekle
      - Input'a `aria-expanded={showDropdownContent}`, `aria-autocomplete="list"`, `aria-controls="search-suggestions"` ekle
    - _Gereksinim: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

  - [ ] 9.5 `src/hooks/useAutocomplete.ts` shared hook'unu oluştur
    - `src/hooks/useAutocomplete.ts` yeni dosyasını oluştur (design doc'taki tam implementasyon)
    - `AutocompleteSuggestion` interface, `DEBOUNCE_MS = 250`, `MIN_CHARS = 2`, `DEFAULT_LIMIT = 8` sabitleri
    - `useAutocomplete(searchTerm, options)` hook'u: debounced Supabase sorgusu, `ilike('title', ...)`, `view_count` sıralaması
    - `src/components/search/SearchAutocomplete.tsx`'de `searchSuggestions` useCallback'i kaldır, `useAutocomplete` import et:
      ```typescript
      import { useAutocomplete } from '@/hooks/useAutocomplete';
      // ...
      const { suggestions, isLoading, search: searchSuggestions, setSuggestions } = useAutocomplete(query);
      ```
    - `grep -r "ilike.*title" src/` ile 3. duplicate dosyayı tespit et ve aynı şekilde migrate et
    - _Gereksinim: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 9.6 Property 6 — useAutocomplete boş sorgu için istek atmaz, property test yaz
    - `src/__tests__/useAutocomplete.test.ts` dosyasını oluştur
    - `renderHook` ile `useAutocomplete('')` çağırıldığında `suggestions` boş array döndüğünü doğrula
    - 0-1 karakter uzunluğundaki string'ler için Supabase'in çağrılmadığını doğrula
    - Test komutu: `npx vitest --run src/__tests__/useAutocomplete.test.ts`
    - **Property 6: useAutocomplete boş sorgu için istek atmaz**
    - **Validates: Requirements 14.5**

  - [ ]* 9.7 Property 7 — useAutocomplete sonuçları arama terimiyle eşleşir, property test yaz
    - Aynı test dosyasına ekle
    - Mock Supabase response ile her returned suggestion'ın title'ının searchTerm'ü içerdiğini doğrula (case-insensitive)
    - Test komutu: `npx vitest --run src/__tests__/useAutocomplete.test.ts`
    - **Property 7: Sonuçlar arama terimiyle eşleşir**
    - **Validates: Requirements 14.2**

- [ ] 10. Final Checkpoint — Tüm testler geçiyor
  - `npx vitest --run` ile tüm test suitelerini çalıştır
  - `npx tsc --noEmit` ile TypeScript derleme hatası olmadığını doğrula
  - Hata varsa kullanıcıya sor.

---

## Notes

- `*` ile işaretli sub-task'lar opsiyoneldir; daha hızlı uygulama için atlanabilir
- Her görev belirli gereksinimlere referans verir; tam izlenebilirlik sağlar
- Property testleri evrensel doğruluk özelliklerini; unit testler ise belirli örnekleri test eder
- Supabase `search_dreams` RPC'sine `offset_count` parametresi eklenmesi için Supabase dashboard'da SQL migration gerekebilir (Görev 9.2)
- Design doc'taki tüm implementasyon detayları (tam kod blokları) bu görevler sırasında başvuru kaynağı olarak kullanılmalıdır

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.6"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5", "1.7", "3.2", "3.3", "3.5"] },
    { "id": 2, "tasks": ["3.1", "3.4", "5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["7.1", "7.2", "7.3", "9.1", "9.4"] },
    { "id": 4, "tasks": ["7.4", "9.2", "9.5"] },
    { "id": 5, "tasks": ["9.3", "9.6", "9.7"] }
  ]
}
```
