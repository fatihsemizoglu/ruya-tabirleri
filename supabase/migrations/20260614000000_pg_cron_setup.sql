-- =====================================================================
-- Supabase pg_cron Setup
-- Description: Enables pg_cron + http extensions and schedules
--   recurring calls to project Edge Functions.
--
-- Apply steps (Supabase Dashboard > SQL Editor):
--   1. Supabase Dashboard > Settings > Database > Extensions
--        Enable:  pg_cron
--        Enable:  http        (provides net.http_post)
--   2. Run this file.
--   3. (Optional) Override the cron secret:
--        ALTER DATABASE postgres SET app.cron_secret = 'YOUR_RANDOM_32_CHARS';
--
-- Verify with: SELECT * FROM cron.job ORDER BY jobname;
-- =====================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Helper view of registered jobs (no-op if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = 'cron_jobs_log'
  ) THEN
    CREATE TABLE public.cron_jobs_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jobname TEXT NOT NULL,
      ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT,
      response JSONB,
      error TEXT
    );
    ALTER TABLE public.cron_jobs_log ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admins can read cron_jobs_log"
      ON public.cron_jobs_log FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;
END$$;

-- 3. Helper function to invoke a function with auth + secret
CREATE OR REPLACE FUNCTION public.invoke_supabase_function(
  p_url TEXT,
  p_body JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret TEXT;
  v_response http_response;
BEGIN
  v_secret := current_setting('app.cron_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    -- Fallback: use service role from env (should be set in DB settings)
    BEGIN
      v_secret := current_setting('app.settings.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  v_response := http((
    'POST',
    p_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('x-cron-secret', COALESCE(v_secret, ''))
    ],
    'application/json',
    p_body::text
  ));

  INSERT INTO public.cron_jobs_log (jobname, status, response, error)
  VALUES (
    split_part(p_url, '/', -1),
    v_response.status,
    v_response.content::jsonb,
    CASE WHEN v_response.status >= 400 THEN v_response.content ELSE NULL END
  );
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.cron_jobs_log (jobname, status, error)
  VALUES (split_part(p_url, '/', -1), 'exception', SQLERRM);
END;
$$;

-- 4. Scheduled jobs (idempotent: unschedule then schedule)
DO $$
DECLARE
  v_base_url TEXT := 'https://srpuegfijtujagpuksgs.supabase.co/functions/v1';
BEGIN
  -- publish-scheduled-posts: every 5 minutes
  PERFORM cron.unschedule('publish-scheduled-posts');
  PERFORM cron.schedule(
    'publish-scheduled-posts',
    '*/5 * * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/publish-scheduled-posts',
    '{}'::jsonb); $job$
  );

  -- sitemap generation: daily 02:00
  PERFORM cron.unschedule('generate-sitemap');
  PERFORM cron.schedule(
    'generate-sitemap',
    '0 2 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/sitemap',
    '{}'::jsonb); $job$
  );

  -- seo audit: daily 03:00
  PERFORM cron.unschedule('seo-audit');
  PERFORM cron.schedule(
    'seo-audit',
    '0 3 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/seo-audit',
    '{"action": "full"}'::jsonb); $job$
  );

  -- zero results analysis: daily 04:00
  PERFORM cron.unschedule('zero-results-analysis');
  PERFORM cron.schedule(
    'zero-results-analysis',
    '0 4 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/zero-results',
    '{}'::jsonb); $job$
  );
END$$;

-- 5. Helper view: last run for each job
CREATE OR REPLACE VIEW public.v_cron_jobs_status AS
SELECT
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  j.last_run_started_at,
  j.last_run_completed_at,
  j.last_run_status,
  (SELECT status FROM public.cron_jobs_log l WHERE l.jobname = j.jobname ORDER BY ran_at DESC LIMIT 1) AS last_http_status,
  (SELECT ran_at FROM public.cron_jobs_log l WHERE l.jobname = j.jobname ORDER BY ran_at DESC LIMIT 1) AS last_http_at
FROM cron.job j
ORDER BY j.jobname;

GRANT SELECT ON public.v_cron_jobs_status TO authenticated;

COMMENT ON TABLE public.cron_jobs_log IS 'pg_cron → Edge Function call audit log';
COMMENT ON VIEW  public.v_cron_jobs_status IS 'Latest status of scheduled cron jobs';
