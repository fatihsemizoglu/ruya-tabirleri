-- Temizlik: site_settings'teki legacy/duplike anahtarlar.
-- Kod (useSiteSettings merge) yalnızca SiteSettings arayüzünde tanımlı anahtarları okur;
-- aşağıdaki satırlar hiçbir yerde kullanılmaz ve kafa karışıklığı yaratır:
--   contact_email        → yetkili: contactEmail (camelCase)
--   site_description     → yetkili: siteDescription
--   site_name            → yetkili: siteName
--   contactLocation      → yetkili: contactAddress
DELETE FROM public.site_settings
WHERE key IN ('contact_email', 'site_description', 'site_name', 'contactLocation');
