-- Create search logs table for analytics
CREATE TABLE public.search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  user_id UUID,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster analytics queries
CREATE INDEX idx_search_logs_query ON public.search_logs (query);
CREATE INDEX idx_search_logs_created_at ON public.search_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert search logs (for anonymous search tracking)
CREATE POLICY "Anyone can insert search logs"
ON public.search_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can view search logs
CREATE POLICY "Admins can view search logs"
ON public.search_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can delete search logs
CREATE POLICY "Admins can delete search logs"
ON public.search_logs
FOR DELETE
USING (is_admin(auth.uid()));