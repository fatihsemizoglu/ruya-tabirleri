-- ============================================================================
-- Kullanıcıyı admin yap: e00b3592-7029-48e7-96e0-93ce12c93f97
-- (f.semizoglu@hotmail.com)
-- ============================================================================
-- Idempotent: kullanıcı zaten admin ise sessizce geçer.
--
-- Notlar:
--   1) public.user_roles.user_id bir FK'dır public.users(id) üzerinde, dolayısıyla
--      hedef kullanıcının public.users'ta da bir kaydı olması gerekir. Bu projede
--      public.users auth.users'tan otomatik senkronize değildir; auth.users'tan
--      encrypted_password çekilerek (gerçek bcrypt hash) public.users'a eklenir.
--   2) Remote DB'de user_roles üzerindeki unique constraint UNIQUE(user_id) şeklinde
--      (her kullanıcının tek bir rolü olabilir); bu yüzden ON CONFLICT (user_id).
-- ============================================================================

-- 1) public.users'a kullanıcıyı ekle (yoksa)
INSERT INTO public.users (id, email, password, created_at, updated_at)
SELECT id, email, encrypted_password, created_at, updated_at
FROM auth.users
WHERE id = 'e00b3592-7029-48e7-96e0-93ce12c93f97'
ON CONFLICT (id) DO NOTHING;

-- 2) Admin rolünü ata (yoksa)
INSERT INTO public.user_roles (user_id, role)
VALUES ('e00b3592-7029-48e7-96e0-93ce12c93f97', 'admin')
ON CONFLICT (user_id) DO NOTHING;
