DO $jobs$
DECLARE
  v_has_cron BOOLEAN;
  v_has_http BOOLEAN;
  v_project_url CONSTANT TEXT := 'https://dagjpitlouekbnwdcpbz.supabase.co/functions/v1';
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO v_has_cron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') INTO v_has_http;

  IF NOT v_has_cron OR NOT v_has_http THEN
    RAISE NOTICE 'pg_cron or http not installed; skipping.';
    RETURN;
  END IF;

  PERFORM cron.schedule(
    'dream-matcher',
    '0 2 * * *',
    $job$ SELECT public.invoke_supabase_function(
      v_project_url || '/dream-matcher',
    '{}'::jsonb); $job$
  );

  PERFORM cron.schedule(
    'dream-reminder',
    '0 8,20 * * *',
    $job$ SELECT public.invoke_supabase_function(
      v_project_url || '/dream-reminder',
    '{}'::jsonb); $job$
  );
END$jobs$;
