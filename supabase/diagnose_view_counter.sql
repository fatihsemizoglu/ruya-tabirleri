-- diagnose_view_counter.sql
-- Canlı DB'de increment_view_count'u 400 (42P10 ON CONFLICT) hatasına düşüren
-- trigger'ı / fonksiyonu bulmak için SQL Editor'de çalıştırın.
-- Sonuçları olduğu gibi paylaşın.

-- 1) increment_view_count fonksiyonunun güncel gövdesi (benim sürümüm mü?)
SELECT pg_get_functiondef('public.increment_view_count'::regproc) AS function_body;

-- 2) dreams tablosundaki tüm trigger'lar (gövde dahil)
SELECT t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'dreams'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3) public şemasında ON CONFLICT içeren SIRADAN fonksiyonlar (suçlu adayı)
--    prokind='f' filtresi aggregate/window fonksiyonlarını dışlar (42809 hatasını önler)
SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS function_body
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND pg_get_functiondef(p.oid) ILIKE '%ON CONFLICT%'
ORDER BY p.proname;
