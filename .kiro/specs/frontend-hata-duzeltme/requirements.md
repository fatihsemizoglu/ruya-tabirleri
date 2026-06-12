# Requirements Document

## Introduction

Bu belge, **ruya-tabirleri-master** React + TypeScript + Supabase + Vite projesinde tespit edilen frontend hatalarının ve güvenlik açıklarının giderilmesine yönelik gereksinimleri tanımlamaktadır. Sorunlar kritiklik sırasına göre gruplandırılmış olup her biri kullanıcı hikayesi ve ölçülebilir kabul kriterleriyle belgelenmiştir.

Proje mimarisi: React 18 + TypeScript, Vite, TanStack React Query v5, Supabase JS v2, React Router v6, Radix UI, Tiptap zengin metin editörü.

---

## Glossary

- **Application**: Tüm ruya-tabirleri-master frontend uygulaması
- **AuthProvider**: `src/contexts/AuthProvider.tsx` içindeki kimlik doğrulama bağlam sağlayıcısı
- **AuthContext**: `src/contexts/auth-context.ts` içinde tanımlanan React context nesnesi
- **useAuth**: `src/hooks/useAuth.ts` içindeki ve `src/hooks/useAuth.tsx` içindeki hook fonksiyonu
- **BlogPost_Page**: `src/pages/BlogPost.tsx` bileşeni
- **DOMPurify**: HTML sanitizasyonu için kullanılacak `dompurify` kütüphanesi
- **RichTextEditor**: `src/components/admin/RichTextEditor.tsx` bileşeni
- **Header**: `src/components/layout/Header.tsx` bileşeni
- **Search_Page**: `src/pages/Search.tsx` bileşeni
- **useSiteSettings**: `src/hooks/useSiteSettings.ts` hook'u
- **Supabase_Client**: `src/integrations/supabase/client.ts` modülü
- **BrowserRouter**: React Router'ın tarayıcı tabanlı yönlendirme sağlayıcısı
- **React_Query**: TanStack Query v5 veri çekme ve önbellekleme kütüphanesi
- **useCallback**: React'ın fonksiyon referansını memoize eden hook'u
- **ESLint_Disable**: `// eslint-disable-next-line react-hooks/exhaustive-deps` yorum direktifi
- **window.prompt**: Tarayıcının yerel metin giriş diyaloğu
- **Radix_Dialog**: `@radix-ui/react-dialog` erişilebilir modal diyalog bileşeni
- **env_variable**: Vite ortam değişkeni (`import.meta.env.VITE_*`)
- **limit_count**: Supabase RPC fonksiyonuna gönderilen kayıt sayısı parametresi
- **server_side_pagination**: Arama sonuçlarının sunucu tarafında sayfalanması
- **race_condition**: İki eş zamanlı işlemin öngörülemeyen sırada tamamlanmasından kaynaklanan hata

---

## Requirements

---

### Gereksinim 1: Ölü Kod Olan useAuth.tsx Dosyasının Silinmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, projede yalnızca tek bir `useAuth` implementasyonunun var olmasını istiyorum; böylece hangi hook'un aktif mimariyle uyumlu olduğu konusunda belirsizlik yaşanmaz.

#### Kabul Kriterleri

1. THE Application SHALL contain exactly one `useAuth` hook implementation, located at `src/hooks/useAuth.ts`.
2. WHEN `src/hooks/useAuth.tsx` is deleted, THE Application SHALL continue to compile and run without errors.
3. THE `useAuth.ts` hook SHALL export a `useAuth` function that reads from `AuthContext` defined in `src/contexts/auth-context.ts`.
4. WHEN any component imports `useAuth`, THE Application SHALL resolve the import to `src/hooks/useAuth.ts`.
5. IF `src/hooks/useAuth.tsx` still exists in the repository after the fix, THEN THE Application SHALL fail the dead-code lint check.

---

### Gereksinim 2: BlogPost Sayfasında XSS Güvenlik Açığının Giderilmesi

**Kullanıcı Hikayesi:** Bir ziyaretçi olarak, blog yazısı sayfasındaki HTML içeriğinin sanitize edilerek render edilmesini istiyorum; böylece kötü amaçlı içerik tarayıcımda çalışmaz.

#### Kabul Kriterleri

1. WHEN a blog post is rendered, THE BlogPost_Page SHALL sanitize `post.content` with DOMPurify before passing it to `dangerouslySetInnerHTML`.
2. THE BlogPost_Page SHALL use `DOMPurify.sanitize(post.content)` with a configuration that removes `<script>` tags and dangerous event attributes (e.g., `onerror`, `onload`).
3. WHEN DOMPurify removes a disallowed tag or attribute from `post.content`, THE BlogPost_Page SHALL still render the remaining safe HTML content.
4. THE Application SHALL include `dompurify` as a production dependency and `@types/dompurify` as a dev dependency in `package.json`.
5. THE BlogPost_Page SHALL pass the TypeScript compiler without errors after DOMPurify integration.

---

### Gereksinim 3: useEffect Dependency Sorunlarının useCallback ile Çözülmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, `useEffect` içinde kullanılan veri çekme fonksiyonlarının `useCallback` ile sarılmış ve bağımlılık dizisine dahil edilmiş olmasını istiyorum; böylece ESLint kuralları devre dışı bırakılmadan doğru React yaşam döngüsü davranışı elde edilir.

#### Kabul Kriterleri

1. THE `DreamDetail.tsx` component SHALL wrap `fetchDream` in `useCallback` with `[slug, user]` as dependencies, and SHALL list `fetchDream` in the `useEffect` dependency array.
2. THE `BlogPost.tsx` component SHALL wrap `fetchPost` in `useCallback` with `[slug]` as a dependency, and SHALL list `fetchPost` in the `useEffect` dependency array.
3. THE `Search.tsx` component SHALL wrap `performSearch` and `fetchRelatedDreams` in `useCallback` with `[]` as dependencies (stable references), and SHALL list them in the relevant `useEffect` dependency arrays.
4. THE `CategoryDetail.tsx`, `Popular.tsx`, `Favorites.tsx`, `History.tsx`, `DreamJournal.tsx`, `Profile.tsx`, and `Blog.tsx` components SHALL each wrap their respective data-fetching functions in `useCallback` and SHALL list them in their `useEffect` dependency arrays.
5. WHEN all components comply with Criteria 1–4, THE Application SHALL have zero `// eslint-disable-next-line react-hooks/exhaustive-deps` directives in the files listed above.
6. IF a `fetchXxx` function references a value that changes on every render (such as an inline object), THEN THE Application SHALL stabilize that value with `useMemo` before including it as a `useCallback` dependency.

---

### Gereksinim 4: RichTextEditor'da window.prompt Yerine Radix Dialog Kullanımı

**Kullanıcı Hikayesi:** Bir içerik editörü olarak, link ve görsel URL'si girerken tarayıcının native prompt diyalogu yerine uygulama temasıyla uyumlu, erişilebilir bir Radix UI Dialog penceresi görmek istiyorum.

#### Kabul Kriterleri

1. THE RichTextEditor SHALL replace `window.prompt('URL girin:')` with a Radix Dialog component for link URL entry.
2. THE RichTextEditor SHALL replace `window.prompt('Görsel URL\'si girin:')` with a Radix Dialog component for image URL entry.
3. WHEN the "Link Ekle" toolbar button is clicked, THE RichTextEditor SHALL open a Dialog containing a text input pre-filled with the current link URL (if any) and "Ekle"/"İptal" action buttons.
4. WHEN the "Görsel Ekle" toolbar button is clicked, THE RichTextEditor SHALL open a Dialog containing a text input and "Ekle"/"İptal" action buttons.
5. WHEN the user clicks "İptal" or presses Escape in the dialog, THE RichTextEditor SHALL close the dialog without modifying editor content.
6. WHEN the user submits an empty URL in the link dialog, THE RichTextEditor SHALL unset the existing link (equivalent to the previous empty-string branch behavior).
7. THE RichTextEditor SHALL use `@radix-ui/react-dialog` which is already listed as a project dependency.

---

### Gereksinim 5: Header Bileşeninde React Query ile Veri Önbellekleme

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, sayfalar arasında gezinirken Header bileşeninin her mount'ta Supabase'e tekrarlayan istekler göndermemesini istiyorum; böylece gereksiz ağ trafiği önlenir.

#### Kabul Kriterleri

1. THE Header SHALL fetch dream categories using a `useQuery` hook with query key `['header-dream-categories']` and a `staleTime` of at least 5 minutes.
2. THE Header SHALL fetch blog categories using a `useQuery` hook with query key `['header-blog-categories']` and a `staleTime` of at least 5 minutes.
3. THE Header SHALL fetch recent blog posts using a `useQuery` hook with query key `['header-recent-posts']` and a `staleTime` of at least 5 minutes.
4. WHEN the Header is unmounted and remounted within the stale window, THE Application SHALL serve the cached data without issuing new Supabase requests.
5. THE Header SHALL remove the manual `useEffect`/`fetchAll` pattern that fires three parallel `supabase` calls directly.
6. WHEN a React Query fetch for header data fails, THE Header SHALL silently fall back to an empty array (no unhandled promise rejection).

---

### Gereksinim 6: Search Sayfasında Server-Side Pagination Uygulanması

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, arama sorgularının tek seferde 10.000 kayıt çekmemesini istiyorum; böylece bellek kullanımı ve ağ gecikmesi azalır.

#### Kabul Kriterleri

1. THE Search_Page SHALL replace `limit_count: 10000` with a server-side pagination approach where `limit_count` equals the number of results per page (e.g., 24 per page).
2. WHEN the user navigates to page N, THE Search_Page SHALL call `search_dreams` RPC with `limit_count = RESULTS_PER_PAGE` and an `offset` parameter equal to `(N - 1) * RESULTS_PER_PAGE`.
3. THE Search_Page SHALL display a "Toplam X sonuç" count obtained from a separate lightweight count query or from a count returned by the RPC, rather than counting the client-side array.
4. WHEN the search term changes, THE Search_Page SHALL reset `currentPage` to 1 and discard previous results.
5. WHEN server-side pagination is active, THE Search_Page client-side filter logic (category, minViews, minLikes) SHALL be migrated to server-side RPC parameters or accepted as limitations with a visible UI note.
6. IF the `search_dreams` RPC does not support an `offset` parameter, THEN THE Application SHALL add the `offset` parameter to the RPC definition in Supabase.

---

### Gereksinim 7: AuthProvider Race Condition'ının Giderilmesi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, oturum açıldığında profil ve rol verilerimin bir kez çekilmesini istiyorum; böylece gereksiz duplicate Supabase istekleri gönderilmez ve tutarsız state oluşmaz.

#### Kabul Kriterleri

1. THE AuthProvider SHALL initialize the Supabase auth state listener (`onAuthStateChange`) before calling `getSession`, following the recommended Supabase pattern to prevent race conditions.
2. WHEN both `getSession` and `onAuthStateChange` fire for the same session, THE AuthProvider SHALL call `fetchProfile` and `fetchRoles` at most once per session initialization.
3. THE AuthProvider SHALL use a ref (e.g., `initializedRef`) or an initialization flag to prevent duplicate `fetchProfile`/`fetchRoles` calls during the startup sequence.
4. WHEN a user signs out, THE AuthProvider SHALL reset `profile`, `roles`, and `isLoading` to their default values exactly once.
5. THE AuthProvider SHALL NOT use `setTimeout(..., 0)` (as seen in `useAuth.tsx`) as the primary deduplication mechanism; instead it SHALL use a deterministic flag-based approach.

---

### Gereksinim 8: BlogPost Sayfasında Sonsuz Loading Durumunun Düzeltilmesi

**Kullanıcı Hikayesi:** Bir ziyaretçi olarak, bir blog yazısı yüklenirken hata oluşsa bile loading göstergesinin ekranda sonsuza kadar kalmamasını istiyorum.

#### Kabul Kriterleri

1. THE `BlogPost.tsx` `fetchPost` function SHALL call `setIsLoading(false)` in a `finally` block, ensuring it executes regardless of success or error.
2. WHEN `fetchPost` receives an error from Supabase, THE BlogPost_Page SHALL set `isLoading` to `false` and navigate away (or show an error state) within the same execution path.
3. WHEN `fetchPost` succeeds, THE BlogPost_Page SHALL set `isLoading` to `false` after all state updates are complete.
4. IF the component unmounts while `fetchPost` is in progress, THEN THE BlogPost_Page SHALL not call `setIsLoading` after unmount (using an `isMounted` ref or AbortController).

---

### Gereksinim 9: Erişilebilirlik Eksikliklerinin Giderilmesi

**Kullanıcı Hikayesi:** Bir erişilebilirlik gereksinimi olan kullanıcı olarak, ekran okuyucu yazılımının navigasyon öğeleri, listeler ve etkileşimli bileşenler hakkında doğru bilgi vermesini istiyorum.

#### Kabul Kriterleri

1. THE Header navigation links SHALL include `aria-current="page"` on the currently active link.
2. THE Header category dropdown button SHALL expose `aria-expanded` with the correct boolean value reflecting the open/closed state of the dropdown.
3. THE Header blog mega-menu button SHALL expose `aria-expanded` with the correct boolean value reflecting the open/closed state of the mega-menu.
4. THE SearchAutocomplete component SHALL apply `role="listbox"` to its suggestions container and `role="option"` to each suggestion item.
5. WHEN the SearchAutocomplete suggestion list is visible, THE SearchAutocomplete SHALL set `aria-expanded="true"` on the search input or its wrapper.
6. THE RichTextEditor toolbar buttons SHALL each have a descriptive `aria-label` attribute (e.g., `aria-label="Link Ekle"`).
7. WHEN interactive icon-only buttons exist in the application, THE Application SHALL provide either an `aria-label` or a visually hidden `<span>` with descriptive text.

---

### Gereksinim 10: useSiteSettings'teki Module-Level Mutable Cache Anti-Pattern'inin Giderilmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, `useSiteSettings` hook'unun React'ın state yönetim modeline uygun bir önbellekleme mekanizması kullanmasını istiyorum; böylece test edilebilirlik ve tahmin edilebilirlik artar.

#### Kabul Kriterleri

1. THE `useSiteSettings` hook SHALL replace the module-level `let cache` variable with React Query (`useQuery`) for data fetching and caching, using query key `['site-settings']`.
2. WHEN `useQuery` is used in `useSiteSettings`, THE hook SHALL set `staleTime` to 60000 milliseconds (60 seconds) to replicate existing cache behavior.
3. THE `invalidateSiteSettingsCache` function SHALL be replaced by calling `queryClient.invalidateQueries({ queryKey: ['site-settings'] })`.
4. WHEN multiple components call `useSiteSettings` simultaneously, THE Application SHALL issue at most one Supabase request per cache window.
5. WHEN the module is hot-reloaded during development, THE Application SHALL not retain stale module-level state from the previous version.

---

### Gereksinim 11: Supabase Ortam Değişkeni Kontrolünün Eklenmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, Supabase client oluşturulmadan önce gerekli ortam değişkenlerinin tanımlı olup olmadığının kontrol edilmesini istiyorum; böylece eksik yapılandırma anında anlaşılır bir hata mesajı ile tespit edilir.

#### Kabul Kriterleri

1. THE Supabase_Client module SHALL check that `VITE_SUPABASE_URL` is a non-empty string before calling `createClient`.
2. THE Supabase_Client module SHALL check that `VITE_SUPABASE_PUBLISHABLE_KEY` is a non-empty string before calling `createClient`.
3. IF `VITE_SUPABASE_URL` is undefined or empty, THEN THE Supabase_Client module SHALL throw an Error with the message `"VITE_SUPABASE_URL ortam değişkeni tanımlı değil."`.
4. IF `VITE_SUPABASE_PUBLISHABLE_KEY` is undefined or empty, THEN THE Supabase_Client module SHALL throw an Error with the message `"VITE_SUPABASE_PUBLISHABLE_KEY ortam değişkeni tanımlı değil."`.
5. WHEN both environment variables are present and non-empty, THE Supabase_Client module SHALL create the client as before without any change in behavior.

---

### Gereksinim 12: Duplike Route'un Redirect ile Çözülmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, `/ruya-tabirleri` ve `/populer` path'lerinin aynı bileşeni doğrudan render etmek yerine birinin diğerine yönlendirmesini istiyorum; böylece URL canonical tutarlılığı sağlanır ve içerik tekrarı önlenir.

#### Kabul Kriterleri

1. THE Application router SHALL define `/populer` as the canonical path for the `Popular` component.
2. WHEN a user navigates to `/ruya-tabirleri`, THE Application SHALL redirect the user to `/populer` using a `<Navigate replace to="/populer" />` element.
3. THE Application SHALL retain only one `<Route>` element that renders the `Popular` component directly; the other SHALL use `<Navigate>`.
4. WHEN the redirect occurs, THE Application SHALL not add `/ruya-tabirleri` to the browser history stack (i.e., the `replace` prop SHALL be set to `true`).

---

### Gereksinim 13: Production'da console.error Çağrılarının Kaldırılması

**Kullanıcı Hikayesi:** Bir geliştirici olarak, production build'de tarayıcı konsoluna hata ve bilgi mesajlarının yazılmamasını istiyorum; böylece hassas hata bilgileri son kullanıcıya görünmez.

#### Kabul Kriterleri

1. THE Application SHALL configure Vite to drop all `console.error`, `console.warn`, and `console.log` calls in production builds via the `drop_console` or `esbuild.drop` option.
2. WHEN the application runs in production mode (`import.meta.env.PROD === true`), THE Application SHALL not write any messages to `console.error`.
3. WHERE error logging is essential for observability, THE Application SHALL replace `console.error` calls with a centralized logging utility that is a no-op in production.
4. THE Application SHALL retain `console.error` calls only in `catch` blocks during development (`import.meta.env.DEV === true`).

---

### Gereksinim 14: Autocomplete Sorgu Duplikasyonunun Giderilmesi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, farklı bileşenlerde tekrarlanan aynı Supabase autocomplete sorgusunun tek bir paylaşımlı hook'a taşınmasını istiyorum; böylece bakım kolaylaşır ve tutarsızlık riski azalır.

#### Kabul Kriterleri

1. THE Application SHALL extract the shared autocomplete query logic into a single custom hook named `useAutocomplete` (or equivalent).
2. THE `useAutocomplete` hook SHALL accept a `searchTerm` string parameter and SHALL return a list of matching dream entries.
3. WHEN `useAutocomplete` is used, THE Application SHALL not duplicate the Supabase query in more than one source file.
4. THE three files that previously contained duplicate autocomplete queries SHALL each import and use `useAutocomplete` instead of defining the query inline.
5. WHEN `searchTerm` is an empty string, THE `useAutocomplete` hook SHALL return an empty array without issuing a Supabase request.

---

### Gereksinim 15: BrowserRouter'ın AuthProvider Dışına Taşınması

**Kullanıcı Hikayesi:** Bir geliştirici olarak, `BrowserRouter`'ın `AuthProvider`'ı sarmalaması yerine `AuthProvider`'ın `BrowserRouter` içinde yer almasını istiyorum; böylece doğru React bağlam sıralaması sağlanır ve olası yönlendirme hataları önlenir.

#### Kabul Kriterleri

1. THE `App` component SHALL render `BrowserRouter` as an outer wrapper that encloses `AuthProvider`.
2. THE `AuthProvider` SHALL be rendered inside `BrowserRouter` so that auth-related navigation calls (e.g., `navigate('/giris')`) work correctly.
3. WHEN the component tree is re-ordered, THE Application SHALL compile and render without errors.
4. THE `QueryClientProvider` SHALL remain the outermost provider in the tree, wrapping both `BrowserRouter` and `AuthProvider`.
5. WHEN the provider order is `QueryClientProvider > BrowserRouter > AuthProvider > TooltipProvider > ...`, THE Application SHALL satisfy the dependency order of all hooks that require both routing and auth contexts.
