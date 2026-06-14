-- =====================================================================
-- Supabase pg_cron Setup
-- Description: Enables pg_cron + http extensions and schedules
--   recurring calls to project Edge Functions.
--
-- Apply steps (Supabase Dashboard > SQL Editor):
--   1. Supabase Dashboard > Settings > Database > Extensions
--        Enable:  pg_cron
--        Enable:  http        (provides net.http_post / http())
--   2. Run this file (or `supabase db push`).
--   3. (Optional) Override the cron secret:
--        ALTER DATABASE postgres SET app.cron_secret = 'YOUR_RANDOM_32_CHARS';
--
-- Verify with: SELECT * FROM cron.job ORDER BY jobname;
-- =====================================================================

-- 1. Extensions (skip silently if not allowed / not available on this plan)
DO $e$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be created (%). Enable it in Supabase Dashboard > Database > Extensions, then re-run this migration.', SQLERRM;
  END;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS http;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'http extension could not be created (%). Enable it in Supabase Dashboard > Database > Extensions, then re-run this migration.', SQLERRM;
  END;
END$e$;

-- 2. Audit table (independent of pg_cron)
DO $t$
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

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace) THEN
      EXECUTE 'CREATE POLICY "Admins can read cron_jobs_log"
        ON public.cron_jobs_log FOR SELECT
        USING (is_admin(auth.uid()))';
    ELSE
      EXECUTE 'CREATE POLICY "Authenticated can read cron_jobs_log"
        ON public.cron_jobs_log FOR SELECT
        TO authenticated
        USING (true)';
    END IF;
  END IF;
END$t$;

-- 3. Helper: invoke a function with cron secret in header
CREATE OR REPLACE FUNCTION public.invoke_supabase_function(
  p_url TEXT,
  p_body JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_secret TEXT;
  v_response http_response;
BEGIN
  BEGIN
    v_secret := current_setting('app.cron_secret', true);
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
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

  BEGIN
    INSERT INTO public.cron_jobs_log (jobname, status, response, error)
    VALUES (
      split_part(p_url, '/', -1),
      v_response.status,
      v_response.content::jsonb,
      CASE WHEN v_response.status >= 400 THEN v_response.content ELSE NULL END
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'cron_jobs_log insert failed: %', SQLERRM;
  END;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.cron_jobs_log (jobname, status, error)
    VALUES (split_part(p_url, '/', -1), 'exception', SQLERRM);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'cron_jobs_log insert failed: %', SQLERRM;
  END;
END;
$fn$;

-- 4. Scheduled jobs (only if pg_cron + http are available)
DO $jobs$
DECLARE
  v_has_cron BOOLEAN;
  v_has_http BOOLEAN;
  v_job RECORD;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO v_has_cron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http')     INTO v_has_http;

  IF NOT v_has_cron THEN
    RAISE NOTICE 'pg_cron not installed; skipping job scheduling. Enable pg_cron in Supabase Dashboard > Database > Extensions, then re-run this migration.';
    RETURN;
  END IF;

  IF NOT v_has_http THEN
    RAISE NOTICE 'http extension not installed; skipping job scheduling. Enable http in Supabase Dashboard > Database > Extensions, then re-run this migration.';
    RETURN;
  END IF;

  -- Defensive unschedule (job may or may not exist)
  FOR v_job IN
    SELECT unnest(ARRAY[
      'publish-scheduled-posts',
      'generate-sitemap',
      'seo-audit',
      'zero-results-analysis'
    ]) AS jobname
  LOOP
    BEGIN
      PERFORM cron.unschedule(v_job.jobname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'unschedule(%) skipped: %', v_job.jobname, SQLERRM;
    END;
  END LOOP;

  -- publish-scheduled-posts: every 5 minutes
  PERFORM cron.schedule(
    'publish-scheduled-posts',
    '*/5 * * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1/publish-scheduled-posts',
    '{}'::jsonb); $job$
  );

  -- sitemap: daily 02:00
  PERFORM cron.schedule(
    'generate-sitemap',
    '0 2 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1/sitemap',
    '{}'::jsonb); $job$
  );

  -- seo audit: daily 03:00
  PERFORM cron.schedule(
    'seo-audit',
    '0 3 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1/seo-audit',
    '{"action": "full"}'::jsonb); $job$
  );

  -- zero results analysis: daily 04:00
  PERFORM cron.schedule(
    'zero-results-analysis',
    '0 4 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1/zero-results',
    '{}'::jsonb); $job$
  );
END$jobs$;

-- 5. Helper view (only if cron.job exists AND has expected columns)
DO $v$
DECLARE
  v_has_last_start BOOLEAN;
  v_has_last_done  BOOLEAN;
  v_has_last_stat  BOOLEAN;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron not installed; skipping v_cron_jobs_status view.';
    RETURN;
  END IF;

  v_has_last_start := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'cron' AND table_name = 'job' AND column_name = 'last_run_started_at'
  );
  v_has_last_done := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'cron' AND table_name = 'job' AND column_name = 'last_run_completed_at'
  );
  v_has_last_stat := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'cron' AND table_name = 'job' AND column_name = 'last_run_status'
  );

  EXECUTE format(
    'CREATE OR REPLACE VIEW public.v_cron_jobs_status AS
     SELECT
       j.jobid,
       j.jobname,
       j.schedule,
       j.active,
       %s
       %s
       %s
       (SELECT status FROM public.cron_jobs_log l WHERE l.jobname = j.jobname ORDER BY ran_at DESC LIMIT 1) AS last_http_status,
       (SELECT ran_at  FROM public.cron_jobs_log l WHERE l.jobname = j.jobname ORDER BY ran_at DESC LIMIT 1) AS last_http_at
     FROM cron.job j
     ORDER BY j.jobname',
    CASE WHEN v_has_last_start THEN 'j.last_run_started_at,'    ELSE 'NULL::timestamptz AS last_run_started_at,'    END,
    CASE WHEN v_has_last_done  THEN 'j.last_run_completed_at,'  ELSE 'NULL::timestamptz AS last_run_completed_at,'  END,
    CASE WHEN v_has_last_stat  THEN 'j.last_run_status,'        ELSE 'NULL::text         AS last_run_status,'        END
  );
END$v$;

GRANT SELECT ON public.v_cron_jobs_status TO authenticated;

COMMENT ON TABLE public.cron_jobs_log IS 'pg_cron → Edge Function call audit log';
COMMENT ON VIEW  public.v_cron_jobs_status IS 'Latest status of scheduled cron jobs';
