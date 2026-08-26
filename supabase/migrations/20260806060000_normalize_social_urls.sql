-- Sosyal medya URL'lerini DB katmanında normalize eder.
-- src/lib/social.ts normalizeSocialUrl() ile BİREBİR aynı mantık (çift koruma):
--   - protokolsüz (instagram.com/x)  → https:// eklenir
--   - '//' protokol-göreli            → aynen bırakılır
--   - http://, https://, mailto:, tel: → aynen bırakılır (case-insensitive)
--   - javascript: vb. eksotik protokol → güvenli boş string (kart gizlenir)
--   - boş/null                        → aynen bırakılır
--
-- Katmanlar:
--   1. normalize_social_url(value)   — saf fonksiyon (TS karşılığıyla parite)
--   2. BEFORE trigger                — her INSERT/UPDATE'te social* değerini normalize eder
--   3. CHECK constraint              — trigger baypas edilse bile geçersiz değer reddedilir
--   4. Tek seferlik UPDATE           — mevcut satırları temizler
--   5. Self-check DO bloğu           — invariant ihlali kalırsa migration başarısız olur

CREATE OR REPLACE FUNCTION public.normalize_social_url(value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  raw text;
  trimmed text;
BEGIN
  IF value IS NULL OR jsonb_typeof(value) <> 'string' THEN
    RETURN value;
  END IF;

  raw := value #>> '{}';
  trimmed := btrim(raw);

  IF trimmed = '' THEN
    RETURN to_jsonb(''::text);
  END IF;

  -- protokol-göreli (//host/path)
  IF trimmed LIKE '//%' THEN
    RETURN to_jsonb(trimmed);
  END IF;

  -- izinli protokoller: http:// https:// mailto: tel: (case-insensitive)
  IF trimmed ~* '^(https?://|mailto:|tel:)' THEN
    RETURN to_jsonb(trimmed);
  END IF;

  -- tanınmayan protokol (javascript:, data: vb.) → güvenli boş (kart gizlenir)
  IF trimmed ~* '^[a-z][a-z0-9+.-]*:' THEN
    RETURN to_jsonb(''::text);
  END IF;

  -- protokolsüz → https:// ekle
  RETURN to_jsonb('https://' || trimmed);
END;
$$;

-- Trigger: social* anahtarlı her yazımda değeri normalize et
CREATE OR REPLACE FUNCTION public.normalize_social_urls_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.key LIKE 'social%' THEN
    NEW.value := public.normalize_social_url(NEW.value);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_social_urls_trigger ON public.site_settings;
CREATE TRIGGER normalize_social_urls_trigger
  BEFORE INSERT OR UPDATE OF value ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_social_urls_trigger();

-- CHECK constraint: trigger baypas edilse bile geçersiz değer yazılamaz
ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_social_url_valid;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_social_url_valid CHECK (
    key NOT LIKE 'social%'
    OR value IS NULL
    OR jsonb_typeof(value) <> 'string'
    OR (value #>> '{}') = ''
    OR (value #>> '{}') LIKE '//%'
    OR (value #>> '{}') ~* '^(https?://|mailto:|tel:)'
  );

-- Tek seferlik temizlik: mevcut satırları normalize et
UPDATE public.site_settings
SET value = public.normalize_social_url(value)
WHERE key LIKE 'social%';

-- Self-check: geçersiz/protokolsüz değer kaldıysa migration başarısız olsun
DO $$
DECLARE
  bad int;
BEGIN
  SELECT count(*) INTO bad
  FROM public.site_settings
  WHERE key LIKE 'social%'
    AND value IS NOT NULL
    AND jsonb_typeof(value) = 'string'
    AND (value #>> '{}') <> ''
    AND NOT ((value #>> '{}') LIKE '//%')
    AND NOT ((value #>> '{}') ~* '^(https?://|mailto:|tel:)');

  IF bad > 0 THEN
    RAISE EXCEPTION 'Invariant ihlali: % sosyal URL geçersiz/protokolsüz kaldı', bad;
  END IF;
END;
$$;
