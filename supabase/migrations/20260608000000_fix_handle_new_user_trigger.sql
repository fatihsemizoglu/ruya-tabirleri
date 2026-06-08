-- ============================================================================
-- Fix: handle_new_user trigger fonksiyonunu orijinal hale getir
-- ============================================================================

-- 1) Kirik fonksiyonu ve trigger'i temizle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2) Orijinal fonksiyonu yeniden olustur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, full_name)
    SELECT
        NEW.id,
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE user_id = NEW.id
    );

    INSERT INTO public.user_roles (user_id, role)
    SELECT
        NEW.id,
        'user'::app_role
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'user'
    );

    RETURN NEW;
END;
$$;

-- 3) Trigger'i yeniden olustur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Backfill: mevcut auth.users kayitlari icin profil olustur
INSERT INTO public.profiles (user_id, username, full_name)
SELECT
    au.id,
    au.raw_user_meta_data ->> 'username',
    au.raw_user_meta_data ->> 'full_name'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- 5) Backfill: mevcut kullanicirollerini ata
INSERT INTO public.user_roles (user_id, role)
SELECT
    au.id,
    'user'::app_role
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'user'
);
