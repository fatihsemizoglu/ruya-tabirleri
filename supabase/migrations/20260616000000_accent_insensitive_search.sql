-- Make search_dreams match Turkish/ASCII variants consistently.
-- Example: "yilan", "Yilan" and "yılan" should all find "Rüyada Yılan Görmek".

CREATE OR REPLACE FUNCTION public.normalize_search_text(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(
    translate(
      coalesce(value, ''),
      'İIıŞşĞğÜüÖöÇçÂâÎîÛû',
      'iiissgguuooccaaiiuu'
    )
  )
$$;

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
  view_count INTEGER,
  like_count INTEGER,
  rank REAL
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
  SELECT
    d.id,
    d.title::TEXT,
    d.slug::TEXT,
    d.content::TEXT,
    d.category_id,
    d.view_count,
    d.like_count,
    (
      CASE WHEN public.normalize_search_text(d.title) = normalized_query THEN 2 ELSE 0 END
      + CASE WHEN public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%' THEN 1 ELSE 0 END
      + CASE WHEN d.slug LIKE '%' || slug_query || '%' THEN 0.8 ELSE 0 END
      + CASE WHEN public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%' THEN 0.2 ELSE 0 END
    )::REAL AS rank
  FROM public.dreams d
  WHERE d.is_published = true
    AND (
      d.title ILIKE '%' || search_query || '%'
      OR public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%'
      OR d.slug LIKE '%' || slug_query || '%'
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
        WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
      )
      OR public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%'
    )
  ORDER BY rank DESC, d.view_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_search_dreams(search_query TEXT)
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

  SELECT COUNT(*)::INTEGER INTO total
  FROM public.dreams d
  WHERE d.is_published = true
    AND (
      d.title ILIKE '%' || search_query || '%'
      OR public.normalize_search_text(d.title) LIKE '%' || normalized_query || '%'
      OR d.slug LIKE '%' || slug_query || '%'
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(coalesce(d.keywords, '[]'::jsonb)) AS keyword
        WHERE public.normalize_search_text(keyword) LIKE '%' || normalized_query || '%'
      )
      OR public.normalize_search_text(d.content) LIKE '%' || normalized_query || '%'
    );

  RETURN total;
END;
$$;
