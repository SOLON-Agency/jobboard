-- ── Profile completeness ─────────────────────────────────────────────────────
-- Adds a smallint column `completeness` (0–100) on public.profiles and keeps it
-- in sync via SECURITY DEFINER triggers on every table that contributes a step
-- toward dashboard onboarding progress.
--
-- The weights mirror the dashboard `ProfileProgress` component:
--
--   role = 'user'                              (total weight 45)
--     ─ Cont creat                             5 (always done)
--     ─ Avatar + Headline + Experiență        10
--     ─ Profil – educație                      5
--     ─ Profil – experiență                    5
--     ─ Profil – competențe                    5
--     ─ Prima alertă                           5
--     ─ Aplicat la un anunț                    5
--     ─ Aplicație retrasă                      5
--
--   role IN ('employer','premium_employer','admin')   (total weight 60)
--     ─ Companie creată                        5
--     ─ Formular creat                        10
--     ─ Anunț creat                           10
--     ─ Gestionează anunțuri                  10
--     ─ Primul candidat                       10
--     ─ Candidat acceptat (shortlisted)       10
--     ─ Arhivare                               5
--
-- Percentage = round(earned_weight / total_weight * 100).

-- ── 1. Column ────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS completeness smallint NOT NULL DEFAULT 0
    CHECK (completeness >= 0 AND completeness <= 100);

COMMENT ON COLUMN public.profiles.completeness IS
  'Onboarding progress as a percentage (0–100). Maintained by triggers; do not write manually.';

-- ── 2. Core compute function ─────────────────────────────────────────────────
-- SECURITY DEFINER so triggers from RLS-protected tables can still read the
-- aggregate counts they need. The function is owned by the migration runner
-- (a Postgres superuser) and only writes the `completeness` column.
CREATE OR REPLACE FUNCTION public.recompute_profile_completeness(p_user_id uuid)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role                          public.user_role;
  v_has_avatar                    boolean;
  v_has_headline                  boolean;
  v_has_experience                boolean;
  v_has_education                 boolean;
  v_has_skills                    boolean;
  v_has_alerts                    boolean;
  v_applications_sent_count       integer;
  v_applications_withdrawn_count  integer;
  v_has_companies                 boolean;
  v_forms_total                   integer;
  v_published_or_draft_jobs       integer;
  v_applications_received         integer;
  v_has_shortlisted               boolean;
  v_has_archived                  boolean;
  v_total_weight                  integer;
  v_earned_weight                 integer;
  v_pct                           smallint;
BEGIN
  SELECT
    role,
    avatar_url IS NOT NULL AND avatar_url <> '',
    headline   IS NOT NULL AND headline   <> ''
  INTO v_role, v_has_avatar, v_has_headline
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN 0;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.profile_experience WHERE user_id = p_user_id)
    INTO v_has_experience;
  SELECT EXISTS (SELECT 1 FROM public.profile_education  WHERE user_id = p_user_id)
    INTO v_has_education;
  SELECT EXISTS (SELECT 1 FROM public.profile_skills     WHERE user_id = p_user_id)
    INTO v_has_skills;

  IF v_role IN ('employer', 'premium_employer', 'admin') THEN
    -- ── Employer / admin tier ────────────────────────────────────────────
    SELECT EXISTS (
      SELECT 1 FROM public.company_users WHERE user_id = p_user_id
    ) INTO v_has_companies;

    SELECT count(*) INTO v_forms_total
    FROM public.forms f
    INNER JOIN public.company_users cu ON cu.company_id = f.company_id
    WHERE cu.user_id = p_user_id;

    SELECT count(*) INTO v_published_or_draft_jobs
    FROM public.job_listings jl
    INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
    WHERE cu.user_id = p_user_id
      AND jl.status IN ('published', 'draft');

    SELECT count(*) INTO v_applications_received
    FROM public.applications a
    INNER JOIN public.job_listings jl ON jl.id = a.job_id
    INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
    WHERE cu.user_id = p_user_id;

    SELECT EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.job_listings jl ON jl.id = a.job_id
      INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
      WHERE cu.user_id = p_user_id
        AND a.status = 'shortlisted'
    ) INTO v_has_shortlisted;

    SELECT EXISTS (
      SELECT 1
      FROM public.companies c
      INNER JOIN public.company_users cu ON cu.company_id = c.id
      WHERE cu.user_id = p_user_id
        AND c.is_archived = true
      UNION ALL
      SELECT 1
      FROM public.job_listings jl
      INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
      WHERE cu.user_id = p_user_id
        AND jl.status = 'archived'
      UNION ALL
      SELECT 1
      FROM public.applications a
      WHERE a.user_id = p_user_id
        AND a.is_archived = true
    ) INTO v_has_archived;

    v_total_weight := 60;
    v_earned_weight :=
        (CASE WHEN v_has_companies                  THEN  5 ELSE 0 END)
      + (CASE WHEN v_forms_total > 0                THEN 10 ELSE 0 END)
      + (CASE WHEN v_published_or_draft_jobs > 0    THEN 10 ELSE 0 END)
      + (CASE WHEN v_published_or_draft_jobs > 0    THEN 10 ELSE 0 END)
      + (CASE WHEN v_applications_received > 0      THEN 10 ELSE 0 END)
      + (CASE WHEN v_has_shortlisted                THEN 10 ELSE 0 END)
      + (CASE WHEN v_has_archived                   THEN  5 ELSE 0 END);
  ELSE
    -- ── Candidate (user) tier ────────────────────────────────────────────
    SELECT EXISTS (SELECT 1 FROM public.alerts WHERE user_id = p_user_id)
      INTO v_has_alerts;

    SELECT count(*) INTO v_applications_sent_count
    FROM public.applications WHERE user_id = p_user_id;

    SELECT count(*) INTO v_applications_withdrawn_count
    FROM public.applications
    WHERE user_id = p_user_id
      AND withdrawn_at IS NOT NULL;

    v_total_weight := 45;
    v_earned_weight :=
        5  -- "Cont creat" — always satisfied once a profile row exists
      + (CASE WHEN v_has_avatar AND v_has_headline AND v_has_experience THEN 10 ELSE 0 END)
      + (CASE WHEN v_has_education                    THEN 5 ELSE 0 END)
      + (CASE WHEN v_has_experience                   THEN 5 ELSE 0 END)
      + (CASE WHEN v_has_skills                       THEN 5 ELSE 0 END)
      + (CASE WHEN v_has_alerts                       THEN 5 ELSE 0 END)
      + (CASE WHEN v_applications_sent_count > 0      THEN 5 ELSE 0 END)
      + (CASE WHEN v_applications_withdrawn_count > 0 THEN 5 ELSE 0 END);
  END IF;

  v_pct := round((v_earned_weight::numeric / v_total_weight::numeric) * 100)::smallint;

  UPDATE public.profiles
     SET completeness = v_pct
   WHERE id = p_user_id
     AND completeness IS DISTINCT FROM v_pct;

  RETURN v_pct;
END;
$$;

-- Lock down direct execution. The function is only meant to be invoked from
-- our trigger wrappers (which run as the function owner via SECURITY DEFINER)
-- or out-of-band from the service role. End-users never need to call it
-- because the triggers below keep `completeness` in sync automatically.
REVOKE EXECUTE ON FUNCTION public.recompute_profile_completeness(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.recompute_profile_completeness(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_profile_completeness(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.recompute_profile_completeness(uuid) TO service_role;

-- ── 3. Trigger glue ──────────────────────────────────────────────────────────
-- A small set of trigger wrappers, each scoped to the rows they need.

-- (a) profile-owned tables: profile_experience / profile_education /
-- profile_skills / alerts / applications (applicant side).
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old uuid;
  v_new uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_profile_completeness(OLD.user_id);
    RETURN OLD;
  END IF;

  v_new := NEW.user_id;
  PERFORM public.recompute_profile_completeness(v_new);

  IF TG_OP = 'UPDATE' THEN
    v_old := OLD.user_id;
    IF v_old IS NOT NULL AND v_old <> v_new THEN
      PERFORM public.recompute_profile_completeness(v_old);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- (b) profile change itself (avatar / headline / role).
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_self()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.recompute_profile_completeness(NEW.id);
  RETURN NEW;
END;
$$;

-- (c) applications also affect the job poster(s).
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_applicant uuid;
  v_job_id    uuid;
  rec         record;
BEGIN
  v_applicant := COALESCE(NEW.user_id, OLD.user_id);
  v_job_id    := COALESCE(NEW.job_id, OLD.job_id);

  IF v_applicant IS NOT NULL THEN
    PERFORM public.recompute_profile_completeness(v_applicant);
  END IF;

  IF v_job_id IS NOT NULL THEN
    FOR rec IN
      SELECT cu.user_id
      FROM public.job_listings jl
      INNER JOIN public.company_users cu ON cu.company_id = jl.company_id
      WHERE jl.id = v_job_id
    LOOP
      PERFORM public.recompute_profile_completeness(rec.user_id);
    END LOOP;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- (d) tables keyed by company_id: forms, job_listings.
-- A change there affects everyone in company_users for that company.
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_by_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old uuid;
  v_new uuid;
  rec   record;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.company_id END;
  v_new := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.company_id END;

  FOR rec IN
    SELECT DISTINCT user_id
    FROM public.company_users
    WHERE company_id IN (v_old, v_new)
      AND company_id IS NOT NULL
  LOOP
    PERFORM public.recompute_profile_completeness(rec.user_id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- (e) the companies table itself (keyed by id) — affects all members.
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  rec  record;
BEGIN
  v_id := COALESCE(NEW.id, OLD.id);

  FOR rec IN
    SELECT user_id FROM public.company_users WHERE company_id = v_id
  LOOP
    PERFORM public.recompute_profile_completeness(rec.user_id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- (f) company_users membership changes affect the added/removed user.
CREATE OR REPLACE FUNCTION public.trg_profile_completeness_company_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_profile_completeness(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM public.recompute_profile_completeness(NEW.user_id);

  IF TG_OP = 'UPDATE' AND OLD.user_id <> NEW.user_id THEN
    PERFORM public.recompute_profile_completeness(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ── 4. Bindings ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS profiles_completeness_self                 ON public.profiles;
DROP TRIGGER IF EXISTS profile_experience_completeness            ON public.profile_experience;
DROP TRIGGER IF EXISTS profile_education_completeness             ON public.profile_education;
DROP TRIGGER IF EXISTS profile_skills_completeness                ON public.profile_skills;
DROP TRIGGER IF EXISTS alerts_completeness                        ON public.alerts;
DROP TRIGGER IF EXISTS applications_completeness                  ON public.applications;
DROP TRIGGER IF EXISTS forms_completeness                         ON public.forms;
DROP TRIGGER IF EXISTS job_listings_completeness                  ON public.job_listings;
DROP TRIGGER IF EXISTS companies_completeness                     ON public.companies;
DROP TRIGGER IF EXISTS company_users_completeness                 ON public.company_users;

CREATE TRIGGER profiles_completeness_self
AFTER INSERT OR UPDATE OF avatar_url, headline, role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_self();

CREATE TRIGGER profile_experience_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.profile_experience
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_user_id();

CREATE TRIGGER profile_education_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.profile_education
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_user_id();

CREATE TRIGGER profile_skills_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.profile_skills
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_user_id();

CREATE TRIGGER alerts_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_user_id();

CREATE TRIGGER applications_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_application();

CREATE TRIGGER forms_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_by_company_id();

CREATE TRIGGER job_listings_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_by_company_id();

CREATE TRIGGER companies_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_company();

CREATE TRIGGER company_users_completeness
AFTER INSERT OR UPDATE OR DELETE ON public.company_users
FOR EACH ROW
EXECUTE FUNCTION public.trg_profile_completeness_company_users();

-- ── 5. One-shot backfill ─────────────────────────────────────────────────────
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_profile_completeness(rec.id);
  END LOOP;
END;
$$;
