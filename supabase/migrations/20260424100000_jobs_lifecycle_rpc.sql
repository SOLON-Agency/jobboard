-- Adds a SECURITY DEFINER RPC that the jobs-lifecycle Edge Function can call
-- (using the service-role key) to resolve the job poster's contact details
-- without exposing auth.users to public callers.
--
-- Also backfills expires_at for any existing published jobs that have none.
--
-- After applying: run `supabase gen types typescript --project-id <ref> > src/types/database.ts`

-- ── RPC: job poster contact for lifecycle notifications ───────────────────────
CREATE OR REPLACE FUNCTION public.job_poster_recipient(p_job_id uuid)
RETURNS TABLE (
  poster_user_id  uuid,
  poster_email    text,
  poster_name     text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    cu.user_id                                         AS poster_user_id,
    u.email::text                                      AS poster_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.email::text,
      'Angajator'
    )                                                  AS poster_name
  FROM public.job_listings jl
  INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
  INNER JOIN auth.users u            ON u.id = cu.user_id
  WHERE jl.id = p_job_id
  ORDER BY
    CASE cu.role WHEN 'owner'::public.company_role THEN 0 ELSE 1 END,
    cu.invited_at ASC NULLS LAST
  LIMIT 1;
$$;

-- Only the service role (Edge Functions) should call this; revoke public access.
REVOKE ALL ON FUNCTION public.job_poster_recipient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_poster_recipient(uuid) TO service_role;

-- ── Backfill: give existing published jobs an expiry of published_at + 6 months ─
UPDATE public.job_listings
SET    expires_at = published_at + INTERVAL '6 months'
WHERE  expires_at IS NULL
  AND  published_at IS NOT NULL
  AND  is_archived = false;
