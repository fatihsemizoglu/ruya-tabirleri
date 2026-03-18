-- Add scheduled_at column to blog_posts for content scheduling
ALTER TABLE public.blog_posts 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient querying of scheduled posts
CREATE INDEX idx_blog_posts_scheduled ON public.blog_posts (scheduled_at) 
WHERE scheduled_at IS NOT NULL AND is_published = false;

-- Create function to publish scheduled posts
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    published_count integer;
BEGIN
    UPDATE public.blog_posts 
    SET is_published = true,
        scheduled_at = NULL,
        updated_at = now()
    WHERE scheduled_at IS NOT NULL 
      AND scheduled_at <= now() 
      AND is_published = false;
    
    GET DIAGNOSTICS published_count = ROW_COUNT;
    RETURN published_count;
END;
$$;