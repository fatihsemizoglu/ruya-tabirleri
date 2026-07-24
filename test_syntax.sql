BEGIN;
INSERT INTO public.dreams (title, slug, content, is_published, is_featured, keywords, meta_title, meta_description, created_at, updated_at) VALUES (
  'TEST RUYA',
  'test-ruya',
  $content$<p>Test icerigi</p>$content$,  
  true, false,
  ARRAY['Test','Rüya'],
  'TEST RUYA',
  'Test icerigi.',
  now(), now()
);
COMMIT;