-- Return paginated search results and total count from a single RPC call
-- while preserving accent-insensitive matching from 20260616000000.
DROP FUNCTION IF EXISTS public.search_dreams(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.search_dreams(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  content TEXT,
  category_id UUID,
  keywords TEXT[],
  view_count INTEGER,
  like_count INTEGER,
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
      coalesce(d.keywords, ARRAY[]::TEXT[]) AS keywords,
      d.view_count,
      d.like_count,
      (
        CASE WHEN public.normalize_search_text(d.title) = normalized_query THEN 10 ELSE 0 END
        + CASE WHEN public.normalize_search_text(d.title) LIKE normalized_query || '%' THEN 6 ELSE 0 END
        + CASE WHEN public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%' THEN 4 ELSE 0 END
        + CASE WHEN d.slug = slug_query THEN 8 ELSE 0 END
        + CASE WHEN d.slug LIKE slug_query || '%' THEN 5 ELSE 0 END
        + CASE WHEN d.slug LIKE '%' || slug_query || '%' THEN 3 ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1
          FROM unnest(coalesce(d.keywords, ARRAY[]::TEXT[])) AS keyword
          WHERE public.normalize_search_text(keyword) = normalized_query
        ) THEN 6 ELSE 0 END
        + CASE WHEN EXISTS (
          SELECT 1
          FROM unnest(coalesce(d.keywords, ARRAY[]::TEXT[])) AS keyword
          WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
        ) THEN 3 ELSE 0 END
        + CASE WHEN public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%' THEN 0.5 ELSE 0 END
      )::REAL AS rank
    FROM public.dreams d
    WHERE d.is_published = true
      AND length(normalized_query) >= 2
      AND (
        d.title ILIKE '%' || search_query || '%'
        OR public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%'
        OR d.slug LIKE '%' || slug_query || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(d.keywords, ARRAY[]::TEXT[])) AS keyword
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
    matched.rank,
    COUNT(*) OVER ()::INTEGER AS total_count
  FROM matched
  WHERE matched.rank >= 3
  ORDER BY matched.rank DESC, matched.view_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
