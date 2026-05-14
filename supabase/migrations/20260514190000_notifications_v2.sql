-- ── Notifications V2 ─────────────────────────────────────────────────────────
--
-- Adds:
--   1. public.notifications            — in-app feed (CREATE TABLE IF NOT EXISTS + RLS)
--   2. public.push_subscriptions       — Web Push VAPID subscriptions per user/device
--   3. profiles.notifications_browser  — channel-on flag for Web Push
--   4. profiles.notification_preferences — JSONB per-type per-channel opt-in map
--   5. public.app_release_announcements — admin-authored release notes for broadcast
--   6. public.app_state                 — single-row key-value for last_announced_version
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. public.notifications ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text,
  type       text        NOT NULL,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users read own notifications'
  ) THEN
    CREATE POLICY "Users read own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users update own notifications'
  ) THEN
    CREATE POLICY "Users update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can insert on behalf of any user (from edge functions).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Service role insert notifications'
  ) THEN
    CREATE POLICY "Service role insert notifications"
      ON public.notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

-- ── 2. public.push_subscriptions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint    text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users manage own push subscriptions'
  ) THEN
    CREATE POLICY "Users manage own push subscriptions"
      ON public.push_subscriptions FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

-- ── 3 & 4. profiles — new notification columns ───────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_browser boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.notifications_browser IS
  'When true the user has granted browser push permission and wants Web Push notifications.';

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'Per-type per-channel opt-in map. Shape: { "<type_key>": { "email": bool, "browser": bool, "sms": bool } }. Missing keys fall back to hardcoded defaults in the dispatcher.';

-- ── 5. public.app_release_announcements ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_release_announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version     text        NOT NULL,
  title       text        NOT NULL,
  body_html   text        NOT NULL DEFAULT '',
  draft       boolean     NOT NULL DEFAULT true,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz
);

ALTER TABLE public.app_release_announcements ENABLE ROW LEVEL SECURITY;

-- Admins (profiles.role = 'admin') can read and write; everyone can read published announcements.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_release_announcements' AND policyname = 'Public read published announcements'
  ) THEN
    CREATE POLICY "Public read published announcements"
      ON public.app_release_announcements FOR SELECT
      USING (draft = false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_release_announcements' AND policyname = 'Admins manage announcements'
  ) THEN
    CREATE POLICY "Admins manage announcements"
      ON public.app_release_announcements FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ── 6. public.app_state ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_state (
  key   text PRIMARY KEY,
  value text
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Everyone can read; only admins (or service role) can write.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_state' AND policyname = 'Anyone reads app_state'
  ) THEN
    CREATE POLICY "Anyone reads app_state"
      ON public.app_state FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_state' AND policyname = 'Admins write app_state'
  ) THEN
    CREATE POLICY "Admins write app_state"
      ON public.app_state FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Seed the initial row so the release-detect cron can read it.
INSERT INTO public.app_state (key, value)
  VALUES ('last_announced_version', '0.0.0')
  ON CONFLICT (key) DO NOTHING;
