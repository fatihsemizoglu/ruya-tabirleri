-- ============================================================================
-- Veri bütünlüğü: Eksik FK constraint'ler + performans indexleri
-- ============================================================================
-- Güvenli/idempotent versiyon: olmayan tabloları atlar, varolan constraint'leri siler.
-- Remote DB state: blog_comment_likes tablosu yok (manuel kurulum farkı).
-- ============================================================================

-- 1) blog_posts.author_id → auth.users(id)
DO $$
BEGIN
  IF to_regclass('public.blog_posts') IS NOT NULL THEN
    ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 2) blog_comments.user_id → auth.users(id) (nullable, guest yorum desteği)
  IF to_regclass('public.blog_comments') IS NOT NULL THEN
    ALTER TABLE public.blog_comments DROP CONSTRAINT IF EXISTS blog_comments_user_id_fkey;
    ALTER TABLE public.blog_comments
      ADD CONSTRAINT blog_comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 3) blog_likes.user_id → auth.users(id)
  IF to_regclass('public.blog_likes') IS NOT NULL THEN
    ALTER TABLE public.blog_likes DROP CONSTRAINT IF EXISTS blog_likes_user_id_fkey;
    ALTER TABLE public.blog_likes
      ADD CONSTRAINT blog_likes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- 4) blog_comment_likes atlandı: tablo remote DB'de yok
  --    (İleride tablo oluşturulursa FK eklenecek)
  -- IF to_regclass('public.blog_comment_likes') IS NOT NULL THEN ... END IF;

  -- 5) audit_logs.user_id → auth.users(id)
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT audit_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Performans: dreams.title ILIKE için pg_trgm index (extension yoksa atla)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dreams_title_trgm ON public.dreams USING GIN (title gin_trgm_ops)';
  END IF;
END $$;

-- 7) Performans: blog_posts.is_published kısmi index
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (is_published)
  WHERE is_published = true;

-- 8) Performans: FK kolonlarında ek index
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON public.blog_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
