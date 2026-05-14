-- ── Matchmaking cron schedule ─────────────────────────────────────────────────
--
-- Schedules the daily matchmaking Edge Function via pg_cron + pg_net.
-- Runs at 08:15 EEST (05:15 UTC), after the daily-digest and profile-nudge jobs.
--
-- Prerequisites (must already be set in your Supabase project):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--   ALTER DATABASE postgres SET "app.cron_secret"   = '<your CRON_SECRET>';
--   ALTER DATABASE postgres SET "app.supabase_url"  = '<your SUPABASE_URL>';
-- ─────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'notifications-matchmaking',
  '15 5 * * *',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/notifications-matchmaking'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := jsonb_build_object('min_overlap', 2)
    );
  $$
);
