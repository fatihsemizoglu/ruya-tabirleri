-- ============================================================================
-- Fix: auth.users <-> public.profiles senkronizasyonu
-- ============================================================================
-- Sorun: profiles tablosuna auth.users'tan otomatik INSERT yapan trigger
-- yoktu. Kullanici profili yoksa, Profile.tsx'teki UPDATE 0 satiri etkiliyor
-- ve kullanici "Kaydedildi" mesaji gorsune ragmen veri kaydolmuyordu.
--
-- Bu migration:
--   1) handle_new_auth_user fonksiyonunu hem public.users hem public.profiles
--      tablosuna INSERT yapacak sekilde gunceller.
--   2) Mevcut auth.users kayitlari icin her iki tabloya backfill yapar.
-- ============================================================================

-- 1) Mevcut fonksiyonu guncelle (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- public.users (FK ihtiyaci olan diger tablolar icin)
    INSERT INTO public.users (id, email, password, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.encrypted_password, ''),
        NEW.created_at,
        COALESCE(NEW.updated_at, NEW.created_at)
    )
    ON CONFLICT (id) DO NOTHING;

    -- public.profiles (kullanici profil bilgileri icin)
    INSERT INTO public.profiles (id, user_id, email, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.id,
        NEW.email,
        NEW.created_at,
        COALESCE(NEW.updated_at, NEW.created_at)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 2) Trigger zaten mevcut (bir onceki migration'dan), tekrar DROP+CREATE gerekmez
--    ama idempotent olmasi icin:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3) Backfill: mevcut auth.users kayitlarini public.profiles'a ekle
INSERT INTO public.profiles (id, user_id, email, created_at, updated_at)
SELECT
    au.id,
    au.id,
    au.email,
    au.created_at,
    COALESCE(au.updated_at, au.created_at)
FROM auth.users au
ON CONFLICT (id) DO NOTHING;
