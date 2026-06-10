-- ============================================================================
-- Güvenlik: public.users tablosundan password hash sütununu kaldır
-- ============================================================================
-- Sorun: auth.users.encrypted_password (bcrypt hash) public.users.password
-- sütununa kopyalanıyordu. public.users RLS ile korunmuyor olabilir.
-- Hash'ler açığa çıkabilir.
--
-- Çözüm:
--   1) password sütununu DROP
--   2) handle_new_auth_user fonksiyonunu password'siz çalışacak şekilde güncelle
-- ============================================================================

-- 1) public.users'tan password sütununu kaldır
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- 2) Trigger fonksiyonunu password'siz güncelle
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- public.users (FK ihtiyaci olan diger tablolar icin)
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
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