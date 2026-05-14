-- ── Notifications V2 — cron schedules ────────────────────────────────────────
--
-- Schedules five new cron jobs using pg_cron + pg_net.
-- Prerequisites (run once in Supabase SQL editor if not already done):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--   ALTER DATABASE postgres SET "app.cron_secret" = '<your CRON_SECRET>';
--   ALTER DATABASE postgres SET "app.supabase_url" = '<your SUPABASE_URL>';
--
-- All times in UTC. Bucharest is UTC+3 in summer (EEST) / UTC+2 in winter (EET).
-- 08:00 Bucharest (summer) = 05:00 UTC.
-- 09:00 Bucharest (summer) = 06:00 UTC.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Daily digest — 08:00 EEST (05:00 UTC) every day ───────────────────────

SELECT cron.schedule(
  'notifications-daily-digest',
  '0 5 * * *',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/notifications-daily-digest'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ── 2. Profile nudge — 08:00 EEST (05:00 UTC) every day ──────────────────────

SELECT cron.schedule(
  'notifications-profile-nudge',
  '5 5 * * *',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/notifications-profile-nudge'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ── 3. Job expiry tomorrow — 09:00 EEST (06:00 UTC) every day ────────────────

SELECT cron.schedule(
  'notifications-job-expiry-tomorrow',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/notifications-job-expiry-tomorrow'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ── 4. Release detect — every 6 hours ────────────────────────────────────────

SELECT cron.schedule(
  'notifications-release-detect',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url     := (SELECT current_setting('app.supabase_url', true) || '/functions/v1/notifications-release-detect'),
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    );
  $$
);
