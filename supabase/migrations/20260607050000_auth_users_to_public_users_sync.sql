-- ============================================================================
-- Fix: auth.users <-> public.users senkronizasyonu
-- ============================================================================
-- Sorun: public.users tablosuna auth.users'tan otomatik kopyalama yoktu.
-- Yeni kayıt olan veya giriş yapan kullanicilar public.users'a eklenmiyordu.
-- Bu nedenle dream_journal, favorites, view_history vb. tablolar
-- (hepsi public.users'a FK bagli) icin INSERT basarisiz oluyordu.
--
-- Bu migration:
--   1) auth.users'a yeni kayit eklendiginde public.users'a otomatik eklenmesi
--      icin AFTER INSERT trigger'i olusturur.
--   2) Mevcut auth.users kayitlarini public.users'a backfill eder.
-- ============================================================================

-- 1) Trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, password, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.encrypted_password, ''),
        NEW.created_at,
        COALESCE(NEW.updated_at, NEW.created_at)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2) Trigger'i olustur (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3) Backfill: mevcut auth.users kayitlarini public.users'a ekle
INSERT INTO public.users (id, email, password, created_at, updated_at)
SELECT
    au.id,
    au.email,
    COALESCE(au.encrypted_password, ''),
    au.created_at,
    COALESCE(au.updated_at, au.created_at)
FROM auth.users au
ON CONFLICT (id) DO NOTHING;
