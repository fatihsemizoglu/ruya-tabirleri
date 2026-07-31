-- Harden dream view count RPC used by DreamDetail.tsx.
--
-- The original function was created without explicit execute grants and updated
-- `view_count` with `view_count + 1`, which is fragile when the column is NULL.
-- Keep the public API unchanged: supabase.rpc('increment_view_count', { dream_id }).

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

-- Explicitly allow the frontend clients to call this harmless counter RPC.
REVOKE ALL ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;