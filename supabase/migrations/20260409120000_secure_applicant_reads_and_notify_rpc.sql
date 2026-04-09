-- Harden notifications: allow applicants to read what they need without a service-role
-- client, and expose poster contact only via a SECURITY DEFINER RPC after an application exists.

-- ── forms: read published forms (needed to load application form fields) ─────
DROP POLICY IF EXISTS "jobboard_applicant_select_published_forms" ON public.forms;
CREATE POLICY "jobboard_applicant_select_published_forms"
ON public.forms
FOR SELECT
TO authenticated
USING (status = 'published' AND COALESCE(is_archived, false) = false);

-- ── form_fields: read fields of published forms ─────────────────────────────
DROP POLICY IF EXISTS "jobboard_applicant_select_form_fields" ON public.form_fields;
CREATE POLICY "jobboard_applicant_select_form_fields"
ON public.form_fields
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = form_fields.form_id
      AND f.status = 'published'
      AND COALESCE(f.is_archived, false) = false
  )
);

-- ── applications: read own rows (duplicate check, notification eligibility) ─
DROP POLICY IF EXISTS "jobboard_applicant_select_own_applications" ON public.applications;
CREATE POLICY "jobboard_applicant_select_own_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ── RPC: first company contact for “new application” emails ─────────────────
-- Callable only when auth.uid() has an applications row for p_job_id; reads
-- auth.users inside definer context (no Supabase auth.admin in app code).
CREATE OR REPLACE FUNCTION public.application_notification_recipient(p_job_id uuid)
RETURNS TABLE (poster_email text, poster_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.email::text AS poster_email,
         COALESCE(
           u.raw_user_meta_data->>'full_name',
           u.email::text,
           'Angajator'
         ) AS poster_name
  FROM public.applications a
  INNER JOIN public.job_listings jl ON jl.id = a.job_id
  INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
  INNER JOIN auth.users u ON u.id = cu.user_id
  WHERE a.job_id = p_job_id
    AND a.user_id = auth.uid()
  ORDER BY
    CASE cu.role WHEN 'owner'::public.company_role THEN 0 ELSE 1 END,
    cu.invited_at ASC NULLS LAST
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.application_notification_recipient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.application_notification_recipient(uuid) TO authenticated;
