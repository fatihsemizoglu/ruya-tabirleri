-- public_dream_pool.content_hash unique indeksini oluştur.
--
-- Neden: dreams üzerindeki add_to_public_pool trigger'ı
--   INSERT INTO public.public_dream_pool (...) VALUES (...)
--   ON CONFLICT (content_hash) DO NOTHING;
-- kullanıyor ama content_hash üzerinde unique constraint/indeks yok.
-- Sonuç: Her dreams UPDATE'i (increment_view_count, beğeni trigger'ı, admin
-- düzenlemesi) trigger'ı tetikliyor → 42P10 ("no unique or exclusion constraint
-- matching the ON CONFLICT specification") → güncelleme geri alınıyor.
--
-- Bu yüzden view_count/like_count hiç artmıyordu (0 kalıyordu).

DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'public_dream_pool'
      AND indexname = 'idx_public_dream_pool_content_hash'
  ) THEN
    RAISE NOTICE 'idx_public_dream_pool_content_hash zaten var, atlandı';
    RETURN;
  END IF;

  -- Kopya content_hash varsa önce temizle (her hash'ten bir satır kalsın).
  -- NULL hash'ler unique indekste birden çok olabildiği için dokunulmaz.
  SELECT count(*) INTO dup_count
  FROM (
    SELECT content_hash
    FROM public.public_dream_pool
    GROUP BY content_hash
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE NOTICE 'public_dream_pool: % kopya content_hash temizleniyor', dup_count;
    DELETE FROM public.public_dream_pool a
    USING public.public_dream_pool b
    WHERE a.content_hash = b.content_hash
      AND a.ctid < b.ctid;
  END IF;

  CREATE UNIQUE INDEX idx_public_dream_pool_content_hash
    ON public.public_dream_pool (content_hash);
  RAISE NOTICE 'idx_public_dream_pool_content_hash oluşturuldu';
END $$;
