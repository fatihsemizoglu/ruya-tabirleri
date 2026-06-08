-- =====================================================
-- Blog Images Storage Bucket Setup
-- =====================================================
-- Bu migration Supabase Storage'da "blog-images" adında
-- public bir bucket oluşturur ve gerekli RLS policy'lerini ekler.
-- Blog yönetiminde kapak görseli yüklemek için kullanılır.
-- =====================================================

-- 1) Bucket oluştur (yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,                  -- public: herkes okuyabilir
  5 * 1024 * 1024,       -- 5 MB dosya boyutu sınırı
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) Policy: Herkes (anon dahil) okuyabilsin
DROP POLICY IF EXISTS "Public read access for blog-images" ON storage.objects;
CREATE POLICY "Public read access for blog-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- 3) Policy: Giriş yapan kullanıcılar yükleyebilsin
DROP POLICY IF EXISTS "Authenticated users can upload to blog-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload to blog-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- 4) Policy: Kullanıcı kendi dosyalarını güncelleyebilsin
-- (Dosya yolu: <user_id>/<file_name> formatında olduğu için
--  ilk klasör user_id'ye eşit olmalı)
DROP POLICY IF EXISTS "Users can update their own files in blog-images" ON storage.objects;
CREATE POLICY "Users can update their own files in blog-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'blog-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5) Policy: Kullanıcı kendi dosyalarını silebilsin
DROP POLICY IF EXISTS "Users can delete their own files in blog-images" ON storage.objects;
CREATE POLICY "Users can delete their own files in blog-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- KULLANIM:
-- =====================================================
-- 1) Supabase Dashboard > SQL Editor'a gidin
-- 2) Bu SQL'i yapıştırıp "Run" tıklayın
-- 3) Storage > blog-images bucket'ı görünecek
-- 4) Admin panelinden blog yazısı eklerken
--    kapak görseli artık dosya yükleme ile seçilebilir
-- =====================================================
