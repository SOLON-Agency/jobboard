-- ── Company skills & matchmaking ──────────────────────────────────────────────
--
-- Adds:
--   1. public.company_skills        — join table (companies ↔ skills), mirrors profile_skills
--   2. public.matches               — deduplicated matchmaking results (company ↔ profile)
--   3. updated_at column + trigger  — on public.companies and public.profiles so the
--                                     matchmaking cron can filter "edited in last 24h"
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 0. Shared set_updated_at trigger function ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 1. updated_at on public.companies ────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'companies_set_updated_at'
      AND tgrelid = 'public.companies'::regclass
  ) THEN
    CREATE TRIGGER companies_set_updated_at
      BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 2. updated_at on public.profiles ─────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'profiles_set_updated_at'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 3. public.company_skills ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_skills (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  skill_id   uuid        NOT NULL REFERENCES public.skills(id)    ON DELETE CASCADE,
  sort_order int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_skills_unique UNIQUE (company_id, skill_id)
);

CREATE INDEX IF NOT EXISTS company_skills_company_id_idx ON public.company_skills (company_id);
CREATE INDEX IF NOT EXISTS company_skills_skill_id_idx   ON public.company_skills (skill_id);

ALTER TABLE public.company_skills ENABLE ROW LEVEL SECURITY;

-- Everyone can read a company's skills (public page).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_skills'
      AND policyname = 'Anyone can read company_skills'
  ) THEN
    CREATE POLICY "Anyone can read company_skills"
      ON public.company_skills FOR SELECT
      USING (true);
  END IF;
END $$;

-- Company members can manage their own company's skills.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_skills'
      AND policyname = 'Company members manage company_skills'
  ) THEN
    CREATE POLICY "Company members manage company_skills"
      ON public.company_skills FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.company_users cu
          WHERE cu.company_id = company_skills.company_id
            AND cu.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.company_users cu
          WHERE cu.company_id = company_skills.company_id
            AND cu.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 4. public.matches ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matches (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  overlap          text[]      NOT NULL DEFAULT '{}',
  overlap_hash     text        NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_notified_at timestamptz,
  CONSTRAINT matches_unique UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS matches_company_id_idx ON public.matches (company_id);
CREATE INDEX IF NOT EXISTS matches_user_id_idx    ON public.matches (user_id);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Candidates can read their own matches.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches'
      AND policyname = 'Candidates read own matches'
  ) THEN
    CREATE POLICY "Candidates read own matches"
      ON public.matches FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Company members can read matches for their company.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches'
      AND policyname = 'Company members read their matches'
  ) THEN
    CREATE POLICY "Company members read their matches"
      ON public.matches FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.company_users cu
          WHERE cu.company_id = matches.company_id
            AND cu.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only service role can insert / update matches (Edge Function uses service key).
-- (No explicit INSERT/UPDATE policy needed; service role bypasses RLS.)
