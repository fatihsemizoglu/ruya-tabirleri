-- ============================================================================
-- Performans indexleri: Sık sorgulanan kolonlar + composite indexler
-- ============================================================================
-- IDEMPOTENT: IF NOT EXISTS ile güvenli, birden fazla uygulanabilir.
-- Query analizi:
--   * dreams: IndexList, Search, Popular, CategoryDetail, DreamDetail
--   * blog_posts: Blog, BlogTag, BlogPost, BlogPost (related)
--   * comments: CommentList (dream_id), Profile (user_id)
--   * favorites: Favorites, Profile (user_id+created_at)
--   * search_history: History (user_id+viewed_at DESC)
--   * blog_subscribers: subscriber listesi
--   * profiles: lookup by user_id (FK)
-- ============================================================================

CREATE OR REPLACE FUNCTION pg_temp.has_columns(target_table regclass, column_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bool_and(
    EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = target_table
        AND attname = column_name
        AND NOT attisdropped
    )
  )
  FROM unnest(column_names) AS column_name;
$$;

-- 1) dreams: Public listing'lerde sıkça filtrelenen kolonlar
DO $$
BEGIN
  IF to_regclass('public.dreams') IS NOT NULL THEN
    IF pg_temp.has_columns('public.dreams', ARRAY['is_published']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_is_published
        ON public.dreams (is_published)
        WHERE is_published = true;
    END IF;

    IF pg_temp.has_columns('public.dreams', ARRAY['is_featured']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_is_featured
        ON public.dreams (is_featured)
        WHERE is_featured = true;
    END IF;

    IF pg_temp.has_columns('public.dreams', ARRAY['category_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_category_id ON public.dreams (category_id);
    END IF;

    IF pg_temp.has_columns('public.dreams', ARRAY['slug']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_slug ON public.dreams (slug);
    END IF;

    IF pg_temp.has_columns('public.dreams', ARRAY['created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_created_at_desc ON public.dreams (created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.dreams', ARRAY['view_count']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_view_count_desc ON public.dreams (view_count DESC NULLS LAST);
    END IF;

    -- Composite: featured listing için (is_published + created_at DESC) birlikte kullanılıyor
    IF pg_temp.has_columns('public.dreams', ARRAY['is_published', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_published_created_at
        ON public.dreams (is_published, created_at DESC)
        WHERE is_published = true;
    END IF;

    -- Composite: popular sıralama için (is_published + view_count DESC)
    IF pg_temp.has_columns('public.dreams', ARRAY['is_published', 'view_count']) THEN
      CREATE INDEX IF NOT EXISTS idx_dreams_published_view_count
        ON public.dreams (is_published, view_count DESC NULLS LAST)
        WHERE is_published = true;
    END IF;
  END IF;
END $$;

-- 2) blog_posts: Public blog listing'lerinde kategori + tarih sıralaması
DO $$
BEGIN
  IF to_regclass('public.blog_posts') IS NOT NULL THEN
    IF pg_temp.has_columns('public.blog_posts', ARRAY['category_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts (category_id);
    END IF;

    IF pg_temp.has_columns('public.blog_posts', ARRAY['slug']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);
    END IF;

    IF pg_temp.has_columns('public.blog_posts', ARRAY['created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at_desc ON public.blog_posts (created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.blog_posts', ARRAY['is_featured']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured
        ON public.blog_posts (is_featured)
        WHERE is_featured = true;
    END IF;

    IF pg_temp.has_columns('public.blog_posts', ARRAY['is_published', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_created_at
        ON public.blog_posts (is_published, created_at DESC)
        WHERE is_published = true;
    END IF;
  END IF;
END $$;

-- 3) comments: Comment listelemede dream_id + tarih sıralaması
DO $$
BEGIN
  IF to_regclass('public.comments') IS NOT NULL THEN
    IF pg_temp.has_columns('public.comments', ARRAY['dream_id', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_comments_dream_id_created_at
        ON public.comments (dream_id, created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.comments', ARRAY['user_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);
    END IF;
  END IF;
END $$;

-- 4) blog_comments: Blog yorumları
DO $$
BEGIN
  IF to_regclass('public.blog_comments') IS NOT NULL THEN
    IF pg_temp.has_columns('public.blog_comments', ARRAY['post_id', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id_created_at
        ON public.blog_comments (post_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- 5) favorites: User bazlı favori listeleme + sayım
DO $$
BEGIN
  IF to_regclass('public.favorites') IS NOT NULL THEN
    IF pg_temp.has_columns('public.favorites', ARRAY['user_id', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id_created_at
        ON public.favorites (user_id, created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.favorites', ARRAY['dream_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_favorites_dream_id ON public.favorites (dream_id);
    END IF;
  END IF;
END $$;

-- 6) search_history: Geçmiş listeleme (user_id + viewed_at DESC)
DO $$
BEGIN
  IF to_regclass('public.search_history') IS NOT NULL THEN
    IF pg_temp.has_columns('public.search_history', ARRAY['user_id', 'viewed_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id_viewed_at
        ON public.search_history (user_id, viewed_at DESC);
    END IF;
  END IF;
END $$;

-- 7) profiles: user_id zaten unique olmalı (auth.users FK), yine de garanti
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF pg_temp.has_columns('public.profiles', ARRAY['user_id']) THEN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
        ON public.profiles (user_id)
        WHERE user_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 8) blog_subscribers: email zaten unique (migration'da) + filtreleme için
DO $$
BEGIN
  IF to_regclass('public.blog_subscribers') IS NOT NULL THEN
    IF pg_temp.has_columns('public.blog_subscribers', ARRAY['is_verified']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_subscribers_is_verified
        ON public.blog_subscribers (is_verified)
        WHERE is_verified = true;
    END IF;

    IF pg_temp.has_columns('public.blog_subscribers', ARRAY['subscribed_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_subscribers_subscribed_at_desc
        ON public.blog_subscribers (subscribed_at DESC NULLS LAST);
    END IF;
  END IF;
END $$;

-- 9) audit_logs: Admin paneli için tarih sıralı listeleme
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    IF pg_temp.has_columns('public.audit_logs', ARRAY['created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
        ON public.audit_logs (created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.audit_logs', ARRAY['entity_type', 'entity_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_entity_id
        ON public.audit_logs (entity_type, entity_id);
    END IF;
  END IF;
END $$;

-- 10) categories: Public listing'lerde sıralı çekim
DO $$
BEGIN
  IF to_regclass('public.categories') IS NOT NULL THEN
    IF pg_temp.has_columns('public.categories', ARRAY['order_index', 'name']) THEN
      CREATE INDEX IF NOT EXISTS idx_categories_order_index_name
        ON public.categories (order_index, name);
    END IF;
  END IF;
END $$;

-- 11) blog_categories: Blog kategori listing
DO $$
BEGIN
  IF to_regclass('public.blog_categories') IS NOT NULL THEN
    IF pg_temp.has_columns('public.blog_categories', ARRAY['order_index', 'name']) THEN
      CREATE INDEX IF NOT EXISTS idx_blog_categories_order_index_name
        ON public.blog_categories (order_index, name);
    END IF;
  END IF;
END $$;

-- 12) ab_test_events: Analytics sorguları
DO $$
BEGIN
  IF to_regclass('public.ab_test_events') IS NOT NULL THEN
    IF pg_temp.has_columns('public.ab_test_events', ARRAY['test_id', 'created_at']) THEN
      CREATE INDEX IF NOT EXISTS idx_ab_test_events_test_id_created_at
        ON public.ab_test_events (test_id, created_at DESC);
    END IF;

    IF pg_temp.has_columns('public.ab_test_events', ARRAY['event_type']) THEN
      CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type
        ON public.ab_test_events (event_type);
    END IF;
  END IF;
END $$;

-- 13) consultants: Randevu/sıralama için
DO $$
BEGIN
  IF to_regclass('public.consultants') IS NOT NULL THEN
    IF pg_temp.has_columns('public.consultants', ARRAY['is_active']) THEN
      CREATE INDEX IF NOT EXISTS idx_consultants_is_active
        ON public.consultants (is_active)
        WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- 14) user_roles: Auth kontrolü
DO $$
BEGIN
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    IF pg_temp.has_columns('public.user_roles', ARRAY['user_id']) THEN
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
    END IF;
  END IF;
END $$;

-- 15) ANALYZE: Query planner'a yeni index'leri bildir
DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'dreams',
    'blog_posts',
    'comments',
    'blog_comments',
    'favorites',
    'search_history',
    'profiles',
    'blog_subscribers',
    'audit_logs',
    'categories',
    'blog_categories',
    'ab_test_events',
    'consultants',
    'user_roles'
  ] LOOP
    IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
      EXECUTE format('ANALYZE public.%I', target_table);
    END IF;
  END LOOP;
END $$;
