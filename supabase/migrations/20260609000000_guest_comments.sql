-- =============================================
-- Guest Comments: Ad Soyad + Email ile yorum
-- =============================================
-- Kullanici istegi: Blog ve ruya tabirlerine uye olmadan,
-- sadece ad soyad ve email ile yorum yapilabilsin.
-- Bu yorumlar admin panelden yonetilebilmeli (mevcut is_approved alani).

-- 1) public.comments tablosunu guest yorumlara ac
ALTER TABLE public.comments
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(200);

-- user_id veya (guest_name + guest_email) zorunlu - CHECK constraint
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_author_check;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_author_check
  CHECK (
    (user_id IS NOT NULL) OR
    (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

-- email formati dogrulama (basit)
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_email_format;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_email_format
  CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2) public.blog_comments tablosunu guest yorumlara ac
ALTER TABLE public.blog_comments
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(200);

ALTER TABLE public.blog_comments
  DROP CONSTRAINT IF EXISTS blog_comments_author_check;
ALTER TABLE public.blog_comments
  ADD CONSTRAINT blog_comments_author_check
  CHECK (
    (user_id IS NOT NULL) OR
    (guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

ALTER TABLE public.blog_comments
  DROP CONSTRAINT IF EXISTS blog_comments_email_format;
ALTER TABLE public.blog_comments
  ADD CONSTRAINT blog_comments_email_format
  CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 3) RLS: Anonim (auth.uid() IS NULL) ziyaretciler INSERT yapabilsin
DROP POLICY IF EXISTS "Anyone can submit comments (with validation)" ON public.comments;
CREATE POLICY "Anyone can submit comments (with validation)"
  ON public.comments FOR INSERT
  WITH CHECK (
    -- Uye yorumu: user_id auth.uid() ile eslesmeli
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Guest yorumu: user_id NULL + ad/email zorunlu
    (user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

-- Okuma politikasi: onayli yorumlar herkes tarafindan gorulebilir (zaten var)
DROP POLICY IF EXISTS "Anyone can submit blog comments (with validation)" ON public.blog_comments;
CREATE POLICY "Anyone can submit blog comments (with validation)"
  ON public.blog_comments FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
  );

-- 4) Index'ler (filtreleme performansi icin)
CREATE INDEX IF NOT EXISTS idx_comments_guest_email ON public.comments(guest_email);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON public.comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_blog_comments_guest_email ON public.blog_comments(guest_email);
CREATE INDEX IF NOT EXISTS idx_blog_comments_is_approved ON public.blog_comments(is_approved);

-- 5) admin_comment_stats fonksiyonu (eger varsa) guncellenmedi - sadece tablolar
