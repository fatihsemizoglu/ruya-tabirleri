-- Rüya görüntülenme / beğeni sayaçlarını onar.
--
-- Neden: Canlı DB'de `increment_view_count` RPC'si ve `dream_likes` beğeni
-- trigger'ı hiç oluşturulmamış (temel migration'lar canlı şemaya uygulanmamış).
-- Sonuç: DreamDetail her sayfa açılışında increment_view_count'u çağırıyor ama
-- 404 dönüyor → view_count hiç artmıyor; aynı şekilde beğeni trigger'ı olmadığı
-- için like_count da güncellenmiyor.
--
-- Doğrulama (REST, rastgele UUID ile): increment_view_count → 404 PGRST202.

-- 1) Rüya görüntülenme sayacı (NULL-güvenli, anon/authenticated'e açık)
CREATE OR REPLACE FUNCTION public.increment_view_count(dream_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dreams
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = dream_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;

-- 2) Rüya beğeni sayacı trigger'ı (dream_likes INSERT/DELETE → like_count)
CREATE OR REPLACE FUNCTION public.update_dream_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dreams
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.dream_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dreams
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.dream_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger'ı idempotent şekilde oluştur (varsa dokunma)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dream_likes_count') THEN
    CREATE TRIGGER update_dream_likes_count
      AFTER INSERT OR DELETE ON public.dream_likes
      FOR EACH ROW EXECUTE FUNCTION public.update_dream_like_count();
  END IF;
END $$;
