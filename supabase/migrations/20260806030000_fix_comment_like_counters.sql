-- Yorum / blog beğeni sayaçlarını onar.
--
-- Neden: Canlı DB'ye temel migration'lar uygulanmadığı için beğeni sayaç
-- trigger'ları (update_comment_likes_count, update_blog_comment_like_count_trigger,
-- update_blog_post_like_count_trigger) oluşturulmamış. Frontend like tablolarına
-- insert/delete yapıyor ama like_count hiç güncellenmiyor.
--
-- Ek olarak like tablolarında (user_id, hedef_id) unique constraint'i yoksa
-- eklenir (aynı kullanıcının çifte beğenisi sayaçları şişirmesin).

-- ============================================================
-- 1) Rüya yorumu beğenileri (comment_likes → comments.like_count)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_likes_count') THEN
    CREATE TRIGGER update_comment_likes_count
      AFTER INSERT OR DELETE ON public.comment_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();
  END IF;
END $$;

-- comment_likes: UNIQUE(user_id, comment_id) güvenceye al
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT user_id, comment_id FROM public.comment_likes
    GROUP BY user_id, comment_id HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE NOTICE 'comment_likes: % kopya (user_id, comment_id) temizleniyor', dup_count;
    DELETE FROM public.comment_likes a
    USING public.comment_likes b
    WHERE a.user_id = b.user_id AND a.comment_id = b.comment_id AND a.ctid < b.ctid;
  END IF;
  BEGIN
    ALTER TABLE public.comment_likes
      ADD CONSTRAINT comment_likes_user_id_comment_id_key UNIQUE (user_id, comment_id);
    RAISE NOTICE 'comment_likes unique constraint eklendi';
  EXCEPTION WHEN duplicate_object OR duplicate_table THEN
    -- duplicate_object (42710): aynı isim+sütun zaten var
    -- duplicate_table  (42P07): aynı isimde constraint var (base migration uygulanmış)
    RAISE NOTICE 'comment_likes unique constraint zaten var';
  END;
END $$;

-- ============================================================
-- 2) Blog yorumu beğenileri (blog_comment_likes → blog_comments.like_count)
-- ============================================================
-- NOT: Canlı DB'de blog_comment_likes tablosu hiç yok (probe: PGRST205).
-- Base migration (20260130083447) bu tabloyu oluşturuyordu ama canlıya
-- uygulanmamış. Frontend (BlogCommentSection.tsx) bu tabloya yazıyor;
-- oluşturulmazsa her blog yorum beğenisi PGRST205 ile sessizce başarısız olur.
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_comment_likes' AND policyname = 'Blog comment likes are viewable by everyone') THEN
    CREATE POLICY "Blog comment likes are viewable by everyone" ON public.blog_comment_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_comment_likes' AND policyname = 'Users can insert own blog comment likes') THEN
    CREATE POLICY "Users can insert own blog comment likes" ON public.blog_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_comment_likes' AND policyname = 'Users can delete own blog comment likes') THEN
    CREATE POLICY "Users can delete own blog comment likes" ON public.blog_comment_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_blog_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_comments
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_comments
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_comment_like_count_trigger') THEN
    CREATE TRIGGER update_blog_comment_like_count_trigger
      AFTER INSERT OR DELETE ON public.blog_comment_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_blog_comment_like_count();
  END IF;
END $$;

-- blog_comment_likes: UNIQUE(comment_id, user_id) güvenceye al
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT comment_id, user_id FROM public.blog_comment_likes
    GROUP BY comment_id, user_id HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE NOTICE 'blog_comment_likes: % kopya temizleniyor', dup_count;
    DELETE FROM public.blog_comment_likes a
    USING public.blog_comment_likes b
    WHERE a.comment_id = b.comment_id AND a.user_id = b.user_id AND a.ctid < b.ctid;
  END IF;
  BEGIN
    ALTER TABLE public.blog_comment_likes
      ADD CONSTRAINT blog_comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);
    RAISE NOTICE 'blog_comment_likes unique constraint eklendi';
  EXCEPTION WHEN duplicate_object OR duplicate_table THEN
    -- duplicate_object (42710): aynı isim+sütun zaten var
    -- duplicate_table  (42P07): aynı isimde constraint var (base migration uygulanmış)
    RAISE NOTICE 'blog_comment_likes unique constraint zaten var';
  END;
END $$;

-- types.ts uyum notu: canlı şemada blog_comment_likes yoktu; migration
-- sonrası (id, comment_id, user_id, created_at) + UNIQUE(comment_id, user_id)
-- şemasıyla oluşur. Supabase types üretimi (`supabase gen types`) bu tabloyu
-- sonraki sürümde otomatik ekler.

-- ============================================================
-- 4) Rüya beğenileri (dream_likes → dreams.like_count)
--    Dikkat: 20260806010000'de trigger oluşturuldu; burada yalnızca
--    UNIQUE(user_id, dream_id) güvenceye alınır (base migration'da tanımlı,
--    canlı şemada eksik olabilir → çifte beğeni sayaçları şişirmesin).
-- ============================================================
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT user_id, dream_id FROM public.dream_likes
    GROUP BY user_id, dream_id HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE NOTICE 'dream_likes: % kopya (user_id, dream_id) temizleniyor', dup_count;
    DELETE FROM public.dream_likes a
    USING public.dream_likes b
    WHERE a.user_id = b.user_id AND a.dream_id = b.dream_id AND a.ctid < b.ctid;
  END IF;
  BEGIN
    ALTER TABLE public.dream_likes
      ADD CONSTRAINT dream_likes_user_id_dream_id_key UNIQUE (user_id, dream_id);
    RAISE NOTICE 'dream_likes unique constraint eklendi';
  EXCEPTION WHEN duplicate_object OR duplicate_table THEN
    -- duplicate_object (42710): aynı isim+sütun zaten var
    -- duplicate_table  (42P07): aynı isimde constraint var (base migration uygulanmış)
    RAISE NOTICE 'dream_likes unique constraint zaten var';
  END;
END $$;

-- ============================================================
-- 3) Blog yazısı beğenileri (blog_likes → blog_posts.like_count)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_blog_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blog_post_like_count_trigger') THEN
    CREATE TRIGGER update_blog_post_like_count_trigger
      AFTER INSERT OR DELETE ON public.blog_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_like_count();
  END IF;
END $$;

-- blog_likes: UNIQUE(post_id, user_id) güvenceye al
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT post_id, user_id FROM public.blog_likes
    GROUP BY post_id, user_id HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE NOTICE 'blog_likes: % kopya temizleniyor', dup_count;
    DELETE FROM public.blog_likes a
    USING public.blog_likes b
    WHERE a.post_id = b.post_id AND a.user_id = b.user_id AND a.ctid < b.ctid;
  END IF;
  BEGIN
    ALTER TABLE public.blog_likes
      ADD CONSTRAINT blog_likes_post_id_user_id_key UNIQUE (post_id, user_id);
    RAISE NOTICE 'blog_likes unique constraint eklendi';
  EXCEPTION WHEN duplicate_object OR duplicate_table THEN
    -- duplicate_object (42710): aynı isim+sütun zaten var
    -- duplicate_table  (42P07): aynı isimde constraint var (base migration uygulanmış)
    RAISE NOTICE 'blog_likes unique constraint zaten var';
  END;
END $$;
