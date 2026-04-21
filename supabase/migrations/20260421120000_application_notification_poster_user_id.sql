-- Extend application_notification_recipient so Edge Functions can resolve the poster's
-- auth user id for per-user notification preferences (profiles.notifications_email).

CREATE OR REPLACE FUNCTION public.application_notification_recipient(p_job_id uuid)
RETURNS TABLE (
  poster_email text,
  poster_name text,
  poster_user_id uuid
)
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
         ) AS poster_name,
         u.id AS poster_user_id
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
