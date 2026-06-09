-- ============================================================================
-- Fix: user_roles UNIQUE constraint
-- ============================================================================
-- Sorun: Orijinal migration'da UNIQUE(user_id, role) (composite) vardi.
-- Remote DB'de UNIQUE(user_id) olarak degistirilmis (her kullaniciya tek rol).
-- Migration 20260607040000 ON CONFLICT (user_id) kullaniyor, bu sadece
-- UNIQUE(user_id) ile calisir. Bu migration local schema'yi remote ile
-- ayni hizaya getirir.
-- ============================================================================

-- 1) Mevcut composite unique constraint'i kaldir
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2) Mevcut duplicate rolleri temizle (en yuksek yetkili rolu tut)
--    admin > moderator > user siralama
DELETE FROM public.user_roles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_roles
  ORDER BY user_id,
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
);

-- 3) Yeni single-column unique constraint ekle
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
