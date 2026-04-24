-- Adds a denormalised applications_count column to job_listings and keeps it
-- in sync via a trigger — same pattern as benefits_count.

ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS applications_count integer NOT NULL DEFAULT 0;

-- Backfill from existing rows
UPDATE public.job_listings jl
SET applications_count = (
  SELECT COUNT(*)::integer
  FROM public.applications a
  WHERE a.job_id = jl.id
);

-- Trigger function: increment on INSERT, decrement on DELETE.
-- We count all applications (including archived/withdrawn) because the badge is
-- about whether the job has ever received a submission, not about active ones.
CREATE OR REPLACE FUNCTION public.trg_update_job_applications_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_listings
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_listings
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_count ON public.applications;
CREATE TRIGGER trg_applications_count
  AFTER INSERT OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_job_applications_count();
