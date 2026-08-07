-- verify_search_dreams.sql
-- search_dreams / count_search_dreams filtre + sayfalama tutarlılık testi.
-- Supabase SQL Editor'de 20260806000000_search_dreams_filters.sql migration'ı
-- uygulandıktan SONRA çalıştırın.
--
-- Neleri kontrol eder:
--   T1  temel (filtresiz): RPC total_count == count_search_dreams
--   T2  featured_only: dönen satırların hepsi is_featured, toplam tutarlı
--   T3  min_views: eşiğin altında satır yok, toplam tutarlı
--   T4  min_likes: eşiğin altında satır yok, toplam tutarlı
--   T5  kategori: yanlış kategoride satır yok, toplam tutarlı
--   T6  sort_by='views': dönen satırlar azalan view_count sırasında
--   T7  birleşik filtreler: kuraldışı satır yok, toplam tutarlı
--   T8  sayfalama: sayfa1+sayfa2 kopyasız ve toplam ile örtüşüyor
--
-- Beklenen çıktı: tüm kontroller PASS, SONUÇ: 0 hata.

DO $$
DECLARE
  v_q TEXT := 'yılan';
  v_rpc_total INTEGER;
  v_cnt_total INTEGER;
  v_bad INTEGER := 0;
  v_cat UUID;
  v_bad_rows INTEGER;
  v_p1 INTEGER;
  v_p2 INTEGER;
  v_dup INTEGER;
BEGIN
  RAISE NOTICE '=== search_dreams filtre/sayfalama doğrulama (sorgu: %) ===', v_q;

  -- T1: temel, filtre yok
  SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0);
  SELECT public.count_search_dreams(v_q) INTO v_cnt_total;
  IF v_rpc_total = v_cnt_total AND v_rpc_total > 0 THEN
    RAISE NOTICE 'PASS T1 temel: total=% (rpc=% / count=%)', v_rpc_total, v_rpc_total, v_cnt_total;
  ELSE
    RAISE NOTICE 'FAIL T1 temel: rpc=% count=%', v_rpc_total, v_cnt_total;
    v_bad := v_bad + 1;
  END IF;

  -- T2: yalnızca öne çıkanlar
  SELECT count(*) INTO v_bad_rows FROM public.search_dreams(v_q, 24, 0, true) WHERE is_featured = false;
  SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0, true);
  SELECT public.count_search_dreams(v_q, true) INTO v_cnt_total;
  IF v_bad_rows = 0 AND v_rpc_total = v_cnt_total THEN
    RAISE NOTICE 'PASS T2 featured: total=%', v_rpc_total;
  ELSE
    RAISE NOTICE 'FAIL T2 featured: featured olmayan satır=% rpc=% count=%', v_bad_rows, v_rpc_total, v_cnt_total;
    v_bad := v_bad + 1;
  END IF;

  -- T3: min_views >= 50
  SELECT count(*) INTO v_bad_rows FROM public.search_dreams(v_q, 24, 0, false, NULL, 50, 0) WHERE view_count < 50;
  SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0, false, NULL, 50, 0);
  SELECT public.count_search_dreams(v_q, false, NULL, 50, 0) INTO v_cnt_total;
  IF v_bad_rows = 0 AND v_rpc_total = v_cnt_total THEN
    RAISE NOTICE 'PASS T3 min_views=50: total=%', v_rpc_total;
  ELSE
    RAISE NOTICE 'FAIL T3 min_views: eşik altı satır=% rpc=% count=%', v_bad_rows, v_rpc_total, v_cnt_total;
    v_bad := v_bad + 1;
  END IF;

  -- T4: min_likes >= 5
  SELECT count(*) INTO v_bad_rows FROM public.search_dreams(v_q, 24, 0, false, NULL, 0, 5) WHERE like_count < 5;
  SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0, false, NULL, 0, 5);
  SELECT public.count_search_dreams(v_q, false, NULL, 0, 5) INTO v_cnt_total;
  IF v_bad_rows = 0 AND v_rpc_total = v_cnt_total THEN
    RAISE NOTICE 'PASS T4 min_likes=5: total=%', v_rpc_total;
  ELSE
    RAISE NOTICE 'FAIL T4 min_likes: eşik altı satır=% rpc=% count=%', v_bad_rows, v_rpc_total, v_cnt_total;
    v_bad := v_bad + 1;
  END IF;

  -- T5: kategori filtresi (en çok rüyası olan kategori)
  SELECT d.category_id INTO v_cat
  FROM public.dreams d
  WHERE d.category_id IS NOT NULL AND d.is_published = true
  GROUP BY d.category_id
  ORDER BY count(*) DESC
  LIMIT 1;
  IF v_cat IS NULL THEN
    RAISE NOTICE 'SKIP T5 kategori: kategorili rüya bulunamadı';
  ELSE
    SELECT count(*) INTO v_bad_rows FROM public.search_dreams(v_q, 24, 0, false, ARRAY[v_cat]) WHERE category_id IS DISTINCT FROM v_cat;
    SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0, false, ARRAY[v_cat]);
    SELECT public.count_search_dreams(v_q, false, ARRAY[v_cat]) INTO v_cnt_total;
    IF v_bad_rows = 0 AND v_rpc_total = v_cnt_total THEN
      RAISE NOTICE 'PASS T5 kategori=%: total=%', v_cat, v_rpc_total;
    ELSE
      RAISE NOTICE 'FAIL T5 kategori: yanlış kategori satırı=% rpc=% count=%', v_bad_rows, v_rpc_total, v_cnt_total;
      v_bad := v_bad + 1;
    END IF;
  END IF;

  -- T6: sort_by='views' — dönen satırlar azalan view_count sırasında olmalı
  SELECT count(*) INTO v_bad_rows FROM (
    SELECT view_count, lag(view_count) OVER () AS prev
    FROM public.search_dreams(v_q, 24, 0, false, NULL, 0, 0, 'views')
  ) x WHERE prev IS NOT NULL AND view_count > prev;
  IF v_bad_rows = 0 THEN
    RAISE NOTICE 'PASS T6 sort_by=views: sıralama doğru';
  ELSE
    RAISE NOTICE 'FAIL T6 sort_by=views: % satır sıra dışı', v_bad_rows;
    v_bad := v_bad + 1;
  END IF;

  -- T7: birleşik filtreler (featured + kategori + min_views + min_likes) + sort_by='newest'
  IF v_cat IS NOT NULL THEN
    SELECT count(*) INTO v_bad_rows FROM public.search_dreams(v_q, 24, 0, true, ARRAY[v_cat], 10, 1, 'newest')
      WHERE is_featured = false OR category_id IS DISTINCT FROM v_cat OR view_count < 10 OR like_count < 1;
    SELECT coalesce(max(total_count), 0) INTO v_rpc_total FROM public.search_dreams(v_q, 24, 0, true, ARRAY[v_cat], 10, 1, 'newest');
    SELECT public.count_search_dreams(v_q, true, ARRAY[v_cat], 10, 1) INTO v_cnt_total;
    IF v_bad_rows = 0 AND v_rpc_total = v_cnt_total THEN
      RAISE NOTICE 'PASS T7 birleşik: total=%', v_rpc_total;
    ELSE
      RAISE NOTICE 'FAIL T7 birleşik: kuraldışı satır=% rpc=% count=%', v_bad_rows, v_rpc_total, v_cnt_total;
      v_bad := v_bad + 1;
    END IF;
  END IF;

  -- T8: sayfalama tutarlılığı
  SELECT count(*) INTO v_p1 FROM public.search_dreams(v_q, 24, 0);
  SELECT count(*) INTO v_p2 FROM public.search_dreams(v_q, 24, 24);
  SELECT count(*) INTO v_dup FROM (
    SELECT id FROM public.search_dreams(v_q, 24, 0)
    INTERSECT ALL
    SELECT id FROM public.search_dreams(v_q, 24, 24)
  ) d;
  SELECT public.count_search_dreams(v_q) INTO v_cnt_total;
  IF v_dup = 0 AND v_p1 + v_p2 = LEAST(v_cnt_total, 48) THEN
    RAISE NOTICE 'PASS T8 sayfalama: p1=% p2=% dup=% (total=%)', v_p1, v_p2, v_dup, v_cnt_total;
  ELSE
    RAISE NOTICE 'FAIL T8 sayfalama: p1=% p2=% dup=% total=%', v_p1, v_p2, v_dup, v_cnt_total;
    v_bad := v_bad + 1;
  END IF;

  RAISE NOTICE '=== SONUÇ: % hata ===', v_bad;
END $$;

-- Fonksiyon imzaları (manuel teyit: 8-arg search_dreams, 5-arg count, dream_search_rank)
SELECT proname AS function, pg_get_function_identity_arguments(oid) AS signature
FROM pg_proc
WHERE proname IN ('search_dreams', 'count_search_dreams', 'dream_search_rank')
ORDER BY proname;
