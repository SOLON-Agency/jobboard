-- ─── pg_cron schedule: unclaimed-companies-nudge ──────────────────────────────
--
-- Fires Mon–Sat at 09:00 Europe/Bucharest (UTC+3 summer / UTC+2 winter).
-- Using UTC 06:00 covers EET summer (UTC+3) – adjust to 07:00 for winter if
-- the cron job is not timezone-aware.
--
-- Prerequisites (run once in the Supabase SQL editor or via psql):
--   1. Enable pg_cron extension:
--        CREATE EXTENSION IF NOT EXISTS pg_cron;
--   2. Enable pg_net extension (for HTTP calls):
--        CREATE EXTENSION IF NOT EXISTS pg_net;
--   3. Store your CRON_SECRET as a database setting:
--        ALTER DATABASE postgres
--          SET "app.cron_secret" = '<your CRON_SECRET value>';
--
-- The cron expression runs Mon–Sat at 06:00 UTC (= 09:00 UTC+3 / EEST).
-- On days when Bucharest is UTC+2 (winter) the function fires at 08:00 local —
-- close enough for a morning nudge; adjust the expression to '0 7 * * 1-6' for
-- the winter months if you need exact local-time firing.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'unclaimed-companies-nudge',
  '0 6 * * 1-6',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/unclaimed-companies-nudge'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);
