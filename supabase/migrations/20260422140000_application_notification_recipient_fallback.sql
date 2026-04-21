-- Resolve job-poster for application emails when company_users has no row (legacy,
-- imports, scraper) but companies.created_by is set.

CREATE OR REPLACE FUNCTION public.application_notification_recipient(p_job_id uuid)
RETURNS TABLE (
  poster_email text,
  poster_name text,
  poster_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.job_id = p_job_id
      AND a.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  -- Prefer an active company member (owner first).
  RETURN QUERY
  SELECT
    u.email::text AS poster_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.email::text,
      'Angajator'
    ) AS poster_name,
    u.id AS poster_user_id
  FROM public.job_listings jl
  INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
  INNER JOIN auth.users u ON u.id = cu.user_id
  WHERE jl.id = p_job_id
  ORDER BY
    CASE cu.role WHEN 'owner'::public.company_role THEN 0 ELSE 1 END,
    cu.invited_at ASC NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- Fallback: company creator (dashboard / wizard set created_by).
  RETURN QUERY
  SELECT
    u.email::text AS poster_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.email::text,
      'Angajator'
    ) AS poster_name,
    u.id AS poster_user_id
  FROM public.job_listings jl
  INNER JOIN public.companies c ON c.id = jl.company_id
  INNER JOIN auth.users u ON u.id = c.created_by
  WHERE jl.id = p_job_id
    AND c.created_by IS NOT NULL
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.application_notification_recipient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.application_notification_recipient(uuid) TO authenticated;
