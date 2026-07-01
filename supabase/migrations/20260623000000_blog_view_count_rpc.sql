-- Blog yazıları için view count artırma RPC'si
-- BlogPost.tsx tarafından çağrılır (supabase.rpc('increment_blog_view_count', { post_id }))

CREATE OR REPLACE FUNCTION public.increment_blog_view_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = post_id;
END;
$$;

-- Yetkiyi açıkça sınırla; sadece anon/authenticated çağırabilsin.
REVOKE ALL ON FUNCTION public.increment_blog_view_count(UUID) FROM PUBLIC;

-- Herkes çağırabilsin (anon dahil) — sadece sayaç artırıyor.
GRANT EXECUTE ON FUNCTION public.increment_blog_view_count(UUID) TO anon, authenticated;
