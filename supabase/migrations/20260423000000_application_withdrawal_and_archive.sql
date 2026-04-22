-- Let applicants close ("withdraw") and archive their own applications.
--
-- Adds:
--   • application_status enum value 'withdrawn'
--   • applications.withdraw_reason     text, nullable
--   • applications.withdrawn_at        timestamptz, nullable
--   • applications.is_archived         boolean, default false
--   • applications.archived_at         timestamptz, nullable
--   • RLS policy: applicants may UPDATE their own application rows
--
-- NOTE on enum + transactions: in Postgres 12+ `ALTER TYPE ... ADD VALUE` is
-- permitted inside a transaction block as long as the new value isn't consumed
-- in the same transaction. We only reference it from application code after
-- this migration has committed, so it is safe to include here.

ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'withdrawn';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS withdraw_reason text,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS applications_user_active_idx
  ON public.applications (user_id, applied_at DESC)
  WHERE is_archived = false;

-- ── Applicants can UPDATE their own applications (status / withdraw / archive)
-- The "only modify own rows" contract is enforced with USING + WITH CHECK.
-- Column-level restrictions (don't let the applicant change job_id / user_id)
-- are enforced through:
--   1. service-layer updates touching only the allowed columns, and
--   2. the WITH CHECK clause continuing to match auth.uid() = user_id, which
--      makes changing user_id to another id impossible.
DROP POLICY IF EXISTS "jobboard_applicant_update_own_applications" ON public.applications;
CREATE POLICY "jobboard_applicant_update_own_applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
