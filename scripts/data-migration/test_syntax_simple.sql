BEGIN;
INSERT INTO public.dreams (title, slug, content, is_published, is_featured) VALUES (
  'Test Rüya',
  'test-ruya-2',
  '<p>Test</p>',
  true,
  false
);
COMMIT;