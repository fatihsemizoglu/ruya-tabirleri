-- Beğeni sayaçlarını gerçek like tablosu verileriyle eşitle (tarihsel backfill).
--
-- Neden: Beğeni sayaç trigger'ları canlıya geç uygulandı (20260806030000).
-- Bundan önce yapılmış beğeniler (blog_likes'te 3 satır) like_count'a
-- yansımamış. Bu migration tüm like_count'ları like tablolarındaki gerçek
-- satır sayısına eşitler.
--
-- Idempotent: her çalıştırmada mevcut değerleri gerçekle karşılaştırır,
-- yalnızca fark varsa günceller. Tekrar çalıştırmak güvenlidir.

UPDATE public.blog_posts p
SET like_count = COALESCE((SELECT count(*) FROM public.blog_likes l WHERE l.post_id = p.id), 0)
WHERE COALESCE((SELECT count(*) FROM public.blog_likes l WHERE l.post_id = p.id), 0) <> COALESCE(p.like_count, 0);

UPDATE public.comments c
SET like_count = COALESCE((SELECT count(*) FROM public.comment_likes l WHERE l.comment_id = c.id), 0)
WHERE COALESCE((SELECT count(*) FROM public.comment_likes l WHERE l.comment_id = c.id), 0) <> COALESCE(c.like_count, 0);

UPDATE public.blog_comments c
SET like_count = COALESCE((SELECT count(*) FROM public.blog_comment_likes l WHERE l.comment_id = c.id), 0)
WHERE COALESCE((SELECT count(*) FROM public.blog_comment_likes l WHERE l.comment_id = c.id), 0) <> COALESCE(c.like_count, 0);

-- Doğrulama (beklenen: hiçbir satır kalmamalı — beğeni sayısı = like_count)
SELECT 'blog_posts' AS tablo,
       count(*) AS etkilenen_satir,
       COALESCE(sum(like_count), 0) AS toplam_like_count
FROM public.blog_posts
WHERE COALESCE((SELECT count(*) FROM public.blog_likes l WHERE l.post_id = blog_posts.id), 0) <> COALESCE(like_count, 0)
UNION ALL
SELECT 'comments',
       count(*),
       COALESCE(sum(like_count), 0)
FROM public.comments
WHERE COALESCE((SELECT count(*) FROM public.comment_likes l WHERE l.comment_id = comments.id), 0) <> COALESCE(like_count, 0)
UNION ALL
SELECT 'blog_comments',
       count(*),
       COALESCE(sum(like_count), 0)
FROM public.blog_comments
WHERE COALESCE((SELECT count(*) FROM public.blog_comment_likes l WHERE l.comment_id = blog_comments.id), 0) <> COALESCE(like_count, 0);
