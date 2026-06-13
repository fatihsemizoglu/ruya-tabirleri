-- =====================================================================
-- Idempotent cron job scheduler
-- Runs the job scheduling section of pg_cron_setup migration.
-- Safe to re-run: unschedules first.
-- =====================================================================

DO $jobs$
DECLARE
  v_has_cron BOOLEAN;
  v_has_http BOOLEAN;
  v_job RECORD;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO v_has_cron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http')     INTO v_has_http;

  IF NOT v_has_cron THEN
    RAISE NOTICE 'pg_cron not installed; skipping.';
    RETURN;
  END IF;
  IF NOT v_has_http THEN
    RAISE NOTICE 'http extension not installed; skipping.';
    RETURN;
  END IF;

  -- Defensive unschedule
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
      RAISE NOTICE 'unscheduled %', v_job.jobname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'unschedule(%) skipped: %', v_job.jobname, SQLERRM;
    END;
  END LOOP;

  PERFORM cron.schedule(
    'publish-scheduled-posts',
    '*/5 * * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/publish-scheduled-posts',
    '{}'::jsonb); $job$
  );
  RAISE NOTICE 'scheduled publish-scheduled-posts (*/5 * * * *)';

  PERFORM cron.schedule(
    'generate-sitemap',
    '0 2 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/sitemap',
    '{}'::jsonb); $job$
  );
  RAISE NOTICE 'scheduled generate-sitemap (0 2 * * *)';

  PERFORM cron.schedule(
    'seo-audit',
    '0 3 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/seo-audit',
    '{"action": "full"}'::jsonb); $job$
  );
  RAISE NOTICE 'scheduled seo-audit (0 3 * * *)';

  PERFORM cron.schedule(
    'zero-results-analysis',
    '0 4 * * *',
    $job$ SELECT public.invoke_supabase_function(
      'https://srpuegfijtujagpuksgs.supabase.co/functions/v1/zero-results',
    '{}'::jsonb); $job$
  );
  RAISE NOTICE 'scheduled zero-results-analysis (0 4 * * *)';
END$jobs$;
