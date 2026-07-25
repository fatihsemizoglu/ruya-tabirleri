-- Dream Audio Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dream-audio',
  'dream-audio',
  true,
  10 * 1024 * 1024,
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read access for dream-audio" ON storage.objects;
CREATE POLICY "Public read access for dream-audio"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'dream-audio');

DROP POLICY IF EXISTS "Authenticated users can upload to dream-audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload to dream-audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dream-audio');

DROP POLICY IF EXISTS "Users can update own files in dream-audio" ON storage.objects;
CREATE POLICY "Users can update own files in dream-audio"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'dream-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'dream-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own files in dream-audio" ON storage.objects;
CREATE POLICY "Users can delete own files in dream-audio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'dream-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
