-- İletişim bilgileri ve sosyal medya ayarları için site_settings seed verisi
-- Bu migration yeni anahtarları ekler; INSERT ... ON CONFLICT ile idempotent.

INSERT INTO site_settings (key, value, created_at, updated_at) VALUES
  ('contactPhone',      '+90 (212) 123 45 67',     NOW(), NOW()),
  ('contactAddress',    'İstanbul, Türkiye',       NOW(), NOW()),
  ('contactWorkingHours','Pzt - Cum: 09:00 - 18:00', NOW(), NOW()),
  ('mapLatitude',       '41.0082',                 NOW(), NOW()),
  ('mapLongitude',      '28.9784',                 NOW(), NOW()),
  ('socialYoutube',     '',                        NOW(), NOW()),
  ('socialLinkedin',    '',                        NOW(), NOW()),
  ('socialTiktok',      '',                        NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
