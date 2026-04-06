-- Allow authenticated candidates to submit in-app applications (custom forms).
-- Fixes: "Nu ai permisiunea de a efectua aceasta acțiune" (Postgres 42501) on apply.
--
-- Notes:
-- - form_response_values INSERT policies subquery form_responses; applicants must be able
--   to SELECT the row they just inserted (same email as JWT), or the WITH CHECK fails.
-- - respondent_email on form_responses must match the signed-in user's email on INSERT.
--
-- Apply with: supabase db push
-- or run this file in Supabase Dashboard → SQL Editor.

-- ── form_responses: read own rows (needed for form_response_values insert RLS chain) ──
DROP POLICY IF EXISTS "jobboard_applicant_select_form_responses_by_email" ON public.form_responses;
CREATE POLICY "jobboard_applicant_select_form_responses_by_email"
ON public.form_responses
FOR SELECT
TO authenticated
USING (
  respondent_email IS NOT NULL
  AND respondent_email = (SELECT auth.jwt() ->> 'email')
);

-- ── form_responses: insert when job is published and uses this form ───────────
DROP POLICY IF EXISTS "jobboard_applicant_insert_form_responses" ON public.form_responses;
CREATE POLICY "jobboard_applicant_insert_form_responses"
ON public.form_responses
FOR INSERT
TO authenticated
WITH CHECK (
  job_listing_id IS NOT NULL
  AND respondent_email IS NOT NULL
  AND respondent_email = (SELECT auth.jwt() ->> 'email')
  AND EXISTS (
    SELECT 1
    FROM public.job_listings jl
    WHERE jl.id = job_listing_id
      AND jl.application_form_id = form_id
      AND jl.status = 'published'::public.job_status
      AND COALESCE(jl.is_archived, false) = false
  )
  AND EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = form_id
      AND COALESCE(f.is_archived, false) = false
      AND f.status = 'published'
  )
);

-- ── form_response_values: insert only for fields that belong to the response's form ──
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
      ON ff.id = form_response_values.field_id
     AND ff.form_id = fr.form_id
    WHERE fr.id = form_response_values.response_id
      AND fr.respondent_email = (SELECT auth.jwt() ->> 'email')
  )
);

-- ── applications: insert own row for published jobs (form + external URL flows) ──
DROP POLICY IF EXISTS "jobboard_applicant_insert_applications" ON public.applications;
CREATE POLICY "jobboard_applicant_insert_applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.job_listings jl
    WHERE jl.id = applications.job_id
      AND jl.status = 'published'::public.job_status
      AND COALESCE(jl.is_archived, false) = false
  )
);

-- ── Storage: uploads for application attachments (forms with file fields)
DROP POLICY IF EXISTS "jobboard_attachments_authenticated_insert" ON storage.objects;
CREATE POLICY "jobboard_attachments_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');
