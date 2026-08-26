-- ============================================================
-- GÜVENLİK SERTLEŞTİRME MİGRASYONU (2026-08-26 denetimi)
--
-- 1) blog_subscribers: anon UPDATE USING(true) kapatıldı (K-1)
--    Doğrulama/iptal artık SECURITY DEFINER fonksiyonlar üzerinden.
-- 2) public_dream_pool: opt-in yapıldı (Y-2 / KVKK)
--    Yalnızca is_private = false olan günlük kayıtları havuza girer;
--    rızasız toplanan mevcut satırlar silinir.
-- 3) dream_analyses / dream_matches: INSERT yalnızca service_role (O-2)
-- 4) log_admin_action: admin kontrolü eklendi (O-1)
-- 5) cron_jobs_log: eski fallback policy temizlendi (D-4)
-- ============================================================

-- ------------------------------------------------------------
-- 1) BLOG SUBSCRIBERS — doğrulama bypass kapatması
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can verify with token" ON public.blog_subscribers;

-- Abonelik oluşturma/güncelleme tamamen service role kullanan edge
-- function'lar üzerinden yapılır; anon/authenticated direkt yazma hakkı yok.
REVOKE INSERT, UPDATE ON public.blog_subscribers FROM anon, authenticated;

-- E-posta + token eşleşmesiyle doğrulama (UUID token brute-force'a kapalı).
CREATE OR REPLACE FUNCTION public.verify_subscription(
    p_email TEXT,
    p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _updated INTEGER;
BEGIN
    IF p_email IS NULL OR p_token IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.blog_subscribers
       SET is_verified = TRUE,
           updated_at  = NOW()
     WHERE email = LOWER(TRIM(p_email))
       AND verification_token::TEXT = p_token
       AND is_verified = FALSE;

    GET DIAGNOSTICS _updated = ROW_COUNT;
    RETURN _updated > 0;
END;
$$;

-- Tek tıkla abonelikten çıkma (yalnızca iptal sütununu yazar).
CREATE OR REPLACE FUNCTION public.unsubscribe_by_email(
    p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _updated INTEGER;
BEGIN
    IF p_email IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.blog_subscribers
       SET unsubscribed_at = NOW(),
           updated_at      = NOW()
     WHERE email = LOWER(TRIM(p_email))
       AND unsubscribed_at IS NULL;

    GET DIAGNOSTICS _updated = ROW_COUNT;
    RETURN _updated > 0;
END;
$$;

-- ------------------------------------------------------------
-- 2) PUBLIC DREAM POOL — opt-in (KVKK)
-- ------------------------------------------------------------

-- Rızasız toplanmış mevcut satırları temizle.
DELETE FROM public.public_dream_pool;

-- Trigger artık yalnızca kullanıcı paylaşımı seçtiğinde (is_private = false) çalışır.
CREATE OR REPLACE FUNCTION public.add_to_public_pool()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.public_dream_pool (
        original_dream_id,
        content_hash,
        short_content,
        symbols,
        emotion,
        category
    ) VALUES (
        NEW.id,
        md5(COALESCE(NEW.content, '')),
        LEFT(COALESCE(NEW.content, ''), 200),
        COALESCE(NEW.symbols, '{}'),
        NEW.emotion,
        'general'
    )
    ON CONFLICT (content_hash) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_add_to_public_pool ON public.dream_journal;
CREATE TRIGGER trg_add_to_public_pool
    AFTER INSERT OR UPDATE OF content, symbols, emotion, is_private ON public.dream_journal
    FOR EACH ROW
    WHEN (NEW.is_private = false AND NEW.content IS NOT NULL AND NEW.content != '')
    EXECUTE FUNCTION public.add_to_public_pool();

-- Kullanıcı daha sonra gizliye çevirirse havuzdan düşür.
CREATE OR REPLACE FUNCTION public.remove_from_public_pool()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.public_dream_pool
     WHERE original_dream_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_remove_from_public_pool ON public.dream_journal;
CREATE TRIGGER trg_remove_from_public_pool
    AFTER UPDATE OF is_private ON public.dream_journal
    FOR EACH ROW
    WHEN (NEW.is_private = true AND OLD.is_private = false)
    EXECUTE FUNCTION public.remove_from_public_pool();

-- ------------------------------------------------------------
-- 3) DREAM ANALYSES / MATCHES — insert kilidi
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Service insert analyses" ON public.dream_analyses;
CREATE POLICY "Service insert analyses" ON public.dream_analyses
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service insert matches" ON public.dream_matches;
CREATE POLICY "Service insert matches" ON public.dream_matches
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 4) LOG_ADMIN_ACTION — admin kontrolü
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_admin_action(
    _action TEXT,
    _entity_type TEXT,
    _entity_id UUID DEFAULT NULL,
    _entity_title TEXT DEFAULT NULL,
    _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _log_id UUID;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'log_admin_action: yalnizca adminler cagirabilir';
    END IF;

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, entity_title, details)
    VALUES (auth.uid(), _action, _entity_type, _entity_id, _entity_title, _details)
    RETURNING id INTO _log_id;

    RETURN _log_id;
END;
$$;

-- ------------------------------------------------------------
-- 5) CRON_JOBS_LOG — eski fallback policy kalıntısı
-- ------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'cron_jobs_log'
          AND policyname = 'Authenticated can read cron_jobs_log'
    ) THEN
        EXECUTE 'DROP POLICY "Authenticated can read cron_jobs_log" ON public.cron_jobs_log';
    END IF;
END $$;
