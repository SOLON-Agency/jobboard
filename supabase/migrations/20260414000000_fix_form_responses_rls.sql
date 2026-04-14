-- Fix: form_responses INSERT policy fails because the EXISTS subqueries for
-- job_listings and forms run under RLS, and if no SELECT policy allows the
-- applicant to read those tables, EXISTS always returns FALSE.
--
-- Solution: move the existence checks into a SECURITY DEFINER helper function
-- that bypasses RLS on sub-tables, while the policy itself still enforces that
-- the respondent_email matches the signed-in user's email.
--
-- Apply with: supabase db push
-- or run in Supabase Dashboard → SQL Editor.

-- ── Helper: validate job + form are published (bypasses RLS on sub-tables) ───
CREATE OR REPLACE FUNCTION public.can_submit_form_response(
  p_form_id        uuid,
  p_job_listing_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.job_listings jl
      WHERE jl.id          = p_job_listing_id
        AND jl.application_form_id = p_form_id
        AND jl.status      = 'published'::public.job_status
        AND COALESCE(jl.is_archived, false) = false
    )
    AND EXISTS (
      SELECT 1
      FROM public.forms f
      WHERE f.id = p_form_id
        AND COALESCE(f.is_archived, false) = false
        AND f.status = 'published'
    );
$$;

-- Grant execute to authenticated users (called from within a policy WITH CHECK)
REVOKE ALL ON FUNCTION public.can_submit_form_response(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_submit_form_response(uuid, uuid) TO authenticated;

-- ── form_responses: updated INSERT policy ────────────────────────────────────
DROP POLICY IF EXISTS "jobboard_applicant_insert_form_responses" ON public.form_responses;
CREATE POLICY "jobboard_applicant_insert_form_responses"
ON public.form_responses
FOR INSERT
TO authenticated
WITH CHECK (
  job_listing_id   IS NOT NULL
  AND form_id      IS NOT NULL
  AND respondent_email IS NOT NULL
  AND respondent_email = auth.email()
  AND public.can_submit_form_response(form_id, job_listing_id)
);

-- ── form_responses: update SELECT policy to use auth.email() consistently ───
DROP POLICY IF EXISTS "jobboard_applicant_select_form_responses_by_email" ON public.form_responses;
CREATE POLICY "jobboard_applicant_select_form_responses_by_email"
ON public.form_responses
FOR SELECT
TO authenticated
USING (
  respondent_email IS NOT NULL
  AND respondent_email = auth.email()
);

-- ── form_response_values: update SELECT subquery to use auth.email() too ─────
DROP POLICY IF EXISTS "jobboard_applicant_insert_form_response_values" ON public.form_response_values;
CREATE POLICY "jobboard_applicant_insert_form_response_values"
ON public.form_response_values
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.form_responses fr
    INNER JOIN public.form_fields ff
      ON ff.id      = form_response_values.field_id
     AND ff.form_id = fr.form_id
    WHERE fr.id               = form_response_values.response_id
      AND fr.respondent_email = auth.email()
  )
);
