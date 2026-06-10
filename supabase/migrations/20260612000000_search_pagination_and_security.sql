-- app_role enum + user_roles (uzak DB'de eksik olabilir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Eski app_role imzalı overload varsa kaldır
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

-- is_admin: role sütunu varchar veya app_role olabilir — text karşılaştırması kullan
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role::text = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin')
$$;

-- search_dreams: offset desteği + toplam sayım fonksiyonu
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
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.slug,
    d.content,
    d.category_id,
    d.view_count,
    d.like_count,
    ts_rank(d.search_vector, plainto_tsquery('simple', search_query)) AS rank
  FROM public.dreams d
  WHERE d.is_published = true
    AND (
      d.search_vector @@ plainto_tsquery('simple', search_query)
      OR d.title ILIKE '%' || search_query || '%'
      OR search_query = ANY(d.keywords)
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
BEGIN
  SELECT COUNT(*)::INTEGER INTO total
  FROM public.dreams d
  WHERE d.is_published = true
    AND (
      d.search_vector @@ plainto_tsquery('simple', search_query)
      OR d.title ILIKE '%' || search_query || '%'
      OR search_query = ANY(d.keywords)
    );
  RETURN total;
END;
$$;

-- Yorumlar varsayılan olarak onay beklesin
ALTER TABLE public.comments ALTER COLUMN is_approved SET DEFAULT false;
ALTER TABLE public.blog_comments ALTER COLUMN is_approved SET DEFAULT false;

-- public.users RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
CREATE POLICY "Users can view own user record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin(auth.uid()));

-- Storage: yalnızca admin yükleyebilsin (eski policy isimlerinin hepsini kaldır)
DROP POLICY IF EXISTS "Authenticated users can upload to blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog-images" ON storage.objects;

CREATE POLICY "Admins can upload to blog-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update blog-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));
