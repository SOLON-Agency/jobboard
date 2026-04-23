-- Add archive support to the alerts table and create the alert-matching RPC
-- used by the alerts-job-match edge function.

-- 1. Add "instant" to the alert_frequency enum (existing: daily, weekly)
ALTER TYPE public.alert_frequency ADD VALUE IF NOT EXISTS 'instant' BEFORE 'daily';

-- 2. Ensure the alerts table exists (may already exist in the DB)
CREATE TABLE IF NOT EXISTS public.alerts (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  filters      jsonb       NOT NULL DEFAULT '{}',
  frequency    public.alert_frequency NOT NULL DEFAULT 'instant',
  is_active    boolean     NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Add archive columns (idempotent)
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS is_archived boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS alerts_user_id_idx    ON public.alerts (user_id);
CREATE INDEX IF NOT EXISTS alerts_is_archived_idx ON public.alerts (is_archived);

-- 5. RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Owner: full CRUD on own rows
CREATE POLICY "alerts_owner_select"   ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_owner_insert"   ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_owner_update"   ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_owner_delete"   ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Admin: can read all alerts
CREATE POLICY "alerts_admin_select" ON public.alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. SECURITY DEFINER match function
--    Returns every active, non-archived alert whose filter criteria are satisfied
--    by the given published job listing.
CREATE OR REPLACE FUNCTION public.alerts_matching_job(_job_id uuid)
RETURNS SETOF public.alerts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.*
  FROM   public.alerts      a
  JOIN   public.job_listings j ON j.id = _job_id
  WHERE  a.is_archived = false
    AND  a.is_active   = true
    AND  j.status      = 'published'
    AND  j.is_archived = false
    -- keyword / full-text (empty string means "no filter")
    AND  (
      a.filters->>'q' IS NULL
      OR a.filters->>'q' = ''
      OR j.search_vector @@ websearch_to_tsquery('simple', a.filters->>'q')
    )
    -- location (substring match)
    AND  (
      a.filters->>'location' IS NULL
      OR a.filters->>'location' = ''
      OR j.location ILIKE '%' || (a.filters->>'location') || '%'
    )
    -- job type
    AND  (
      a.filters->>'type' IS NULL
      OR a.filters->>'type' = ''
      OR j.job_type = a.filters->>'type'
    )
    -- experience level (alert stores a single value; job stores an array)
    AND  (
      a.filters->>'experience' IS NULL
      OR a.filters->>'experience' = ''
      OR (a.filters->>'experience') = ANY(COALESCE(j.experience_level, ARRAY[]::text[]))
    )
    -- salary min
    AND  (
      a.filters->>'salaryMin' IS NULL
      OR a.filters->>'salaryMin' = ''
      OR j.salary_min >= (a.filters->>'salaryMin')::numeric
    )
    -- salary max
    AND  (
      a.filters->>'salaryMax' IS NULL
      OR a.filters->>'salaryMax' = ''
      OR j.salary_max <= (a.filters->>'salaryMax')::numeric
    )
    -- remote flag (only filter when explicitly 'true' or 'false')
    AND  (
      a.filters->>'remote' IS NULL
      OR a.filters->>'remote' = ''
      OR (a.filters->>'remote')::boolean = j.is_remote
    )
    -- minimum benefits count
    AND  (
      a.filters->>'minBenefits' IS NULL
      OR a.filters->>'minBenefits' = ''
      OR j.benefits_count >= (a.filters->>'minBenefits')::int
    );
$$;

-- Only the service-role key (used by the edge function) can call this function.
-- Authenticated users do not need to call it directly.
REVOKE ALL ON FUNCTION public.alerts_matching_job(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.alerts_matching_job(uuid) TO service_role;
