-- search_dreams RPC'sine gelişmiş filtre parametreleri ekle.
--
-- Neden: Search.tsx filtreleri (öne çıkanlar, kategori, min beğeni/görüntüleme,
-- sıralama) daha önce yalnızca istemcide, o anki sayfadaki 24 sonuca uygulanıyordu;
-- totalCount filtresiz server toplamı olduğu için filtre + sayfalama tutarsızdı
-- ("X sonuç / N sayfa" yanlış görünüyor, sayfa 2'de filtre sonuçları değişiyordu).
--
-- Filtreler artık doğrudan SQL'de uygulanıyor: sayfalama (LIMIT/OFFSET) filtrelenmiş
-- kümeye uygulanır, total_count filtrelenmiş toplamı döner.
--
-- Ayrıca arama skoru ortak bir yardımcı fonksiyona (dream_search_rank) taşındı;
-- count_search_dreams artık search_dreams ile aynı rank >= 3 eşiğini uyguladığı için
-- "toplam sonuç" sayısı dönen satırlarla birebir tutarlıdır.
--
-- Geriye dönük uyum: Yeni parametrelerin hepsi DEFAULT'lu olduğundan eski çağrılar
-- (search_query, limit_count, offset_count) ve count_search_dreams(search_query)
-- aynen çalışmaya devam eder. Eski overload'lar belirsizliği önlemek için düşürülür.

DROP FUNCTION IF EXISTS public.search_dreams(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.search_dreams(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.count_search_dreams(TEXT);

-- Ortak arama skoru (search_dreams ve count_search_dreams aynı mantığı kullansın)
CREATE OR REPLACE FUNCTION public.dream_search_rank(
  d public.dreams,
  normalized_query TEXT,
  slug_query TEXT
)
RETURNS REAL
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT (
    CASE WHEN public.normalize_search_text(d.title) = normalized_query THEN 10 ELSE 0 END
    + CASE WHEN public.normalize_search_text(d.title) LIKE normalized_query || '%' THEN 6 ELSE 0 END
    + CASE WHEN public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%' THEN 4 ELSE 0 END
    + CASE WHEN d.slug = slug_query THEN 8 ELSE 0 END
    + CASE WHEN d.slug LIKE slug_query || '%' THEN 5 ELSE 0 END
    + CASE WHEN d.slug LIKE '%' || slug_query || '%' THEN 3 ELSE 0 END
    + CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
        WHERE public.normalize_search_text(keyword) = normalized_query
      ) THEN 6 ELSE 0 END
    + CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
        WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
      ) THEN 3 ELSE 0 END
    + CASE WHEN public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%' THEN 0.5 ELSE 0 END
  )::REAL
$$;

CREATE OR REPLACE FUNCTION public.search_dreams(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  featured_only BOOLEAN DEFAULT false,
  category_ids UUID[] DEFAULT NULL,
  min_views INTEGER DEFAULT 0,
  min_likes INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'relevance'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  content TEXT,
  category_id UUID,
  keywords JSONB,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  rank REAL,
  total_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_query TEXT := public.normalize_search_text(search_query);
  slug_query TEXT := regexp_replace(public.normalize_search_text(search_query), '[^a-z0-9]+', '-', 'g');
  safe_limit INTEGER := LEAST(GREATEST(COALESCE(limit_count, 20), 1), 50);
  safe_offset INTEGER := GREATEST(COALESCE(offset_count, 0), 0);
BEGIN
  IF length(trim(coalesce(search_query, ''))) = 0 THEN
    RETURN;
  END IF;

  slug_query := trim(both '-' from slug_query);

  RETURN QUERY
  WITH matched AS (
    SELECT
      d.id,
      d.title::TEXT AS title,
      d.slug::TEXT AS slug,
      d.content::TEXT AS content,
      d.category_id,
      coalesce(d.keywords, '[]'::jsonb) AS keywords,
      d.view_count,
      d.like_count,
      coalesce(d.is_featured, false) AS is_featured,
      d.created_at,
      public.dream_search_rank(d, normalized_query, slug_query) AS rank
    FROM public.dreams d
    WHERE d.is_published = true
      AND length(normalized_query) >= 2
      AND (
        d.title ILIKE '%' || search_query || '%'
        OR public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%'
        OR d.slug LIKE '%' || slug_query || '%'
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
          WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
        )
        OR (
          length(normalized_query) >= 4
          AND public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%'
          AND (
            public.normalize_search_text(d.title) LIKE '%' || left(normalized_query, 3) || '%'
            OR d.slug LIKE '%' || left(slug_query, 3) || '%'
          )
        )
      )
      -- Gelişmiş filtreler (server-side)
      AND (featured_only = false OR coalesce(d.is_featured, false) = true)
      AND (category_ids IS NULL OR d.category_id = ANY(category_ids))
      AND coalesce(d.view_count, 0) >= min_views
      AND coalesce(d.like_count, 0) >= min_likes
  )
  SELECT
    matched.id,
    matched.title,
    matched.slug,
    matched.content,
    matched.category_id,
    matched.keywords,
    matched.view_count,
    matched.like_count,
    matched.is_featured,
    matched.created_at,
    matched.rank,
    COUNT(*) OVER ()::INTEGER AS total_count
  FROM matched
  WHERE matched.rank >= 3
  ORDER BY
    CASE WHEN sort_by = 'views'  THEN matched.view_count END DESC NULLS LAST,
    CASE WHEN sort_by = 'likes'  THEN matched.like_count END DESC NULLS LAST,
    CASE WHEN sort_by = 'newest' THEN matched.created_at  END DESC NULLS LAST,
    matched.rank DESC,
    matched.view_count DESC,
    matched.id  -- deterministik tiebreaker: eşit skorlarda sayfalama kaymasını önler
  LIMIT safe_limit
  OFFSET safe_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_search_dreams(
  search_query TEXT,
  featured_only BOOLEAN DEFAULT false,
  category_ids UUID[] DEFAULT NULL,
  min_views INTEGER DEFAULT 0,
  min_likes INTEGER DEFAULT 0
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
  normalized_query TEXT := public.normalize_search_text(search_query);
  slug_query TEXT := regexp_replace(public.normalize_search_text(search_query), '[^a-z0-9]+', '-', 'g');
BEGIN
  IF length(trim(coalesce(search_query, ''))) = 0 THEN
    RETURN 0;
  END IF;

  slug_query := trim(both '-' from slug_query);

  -- search_dreams ile birebir aynı eşleşme koşulları + rank >= 3 eşiği,
  -- böylece toplam sonuç sayısı dönen satırlarla tutarlıdır.
  SELECT COUNT(*)::INTEGER INTO total
  FROM public.dreams d
  WHERE d.is_published = true
    AND length(normalized_query) >= 2
    AND (
      d.title ILIKE '%' || search_query || '%'
      OR public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%'
      OR d.slug LIKE '%' || slug_query || '%'
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
        WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
      )
      OR (
        length(normalized_query) >= 4
        AND public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%'
        AND (
          public.normalize_search_text(d.title) LIKE '%' || left(normalized_query, 3) || '%'
          OR d.slug LIKE '%' || left(slug_query, 3) || '%'
        )
      )
    )
    AND public.dream_search_rank(d, normalized_query, slug_query) >= 3
    AND (featured_only = false OR coalesce(d.is_featured, false) = true)
    AND (category_ids IS NULL OR d.category_id = ANY(category_ids))
    AND coalesce(d.view_count, 0) >= min_views
    AND coalesce(d.like_count, 0) >= min_likes;

  RETURN total;
END;
$$;
