ALTER TABLE public.blog_subscribers
ADD COLUMN IF NOT EXISTS preferred_category_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_preferred_category_ids
  ON public.blog_subscribers USING GIN (preferred_category_ids);
