-- ── User roles ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'user',
    'employer',
    'premium_employer',
    'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add role to profiles (existing users default to 'user').
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- ── Skills approval ────────────────────────────────────────────────────────────
-- New skills added by users start as unapproved (admin must approve).
-- Existing skills are grandfathered in as approved.

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE;

-- Skills inserted going forward default to FALSE; existing ones are TRUE (see above).
ALTER TABLE public.skills ALTER COLUMN is_approved SET DEFAULT FALSE;

-- ── SECURITY DEFINER RPCs (admin-only privileged operations) ──────────────────

-- Change any user's role. Only callable by an admin.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id  UUID,
  p_role     public.user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

-- Approve or disapprove a skill. Only callable by an admin.
CREATE OR REPLACE FUNCTION public.admin_set_skill_approval(
  p_skill_id    UUID,
  p_is_approved BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  UPDATE public.skills SET is_approved = p_is_approved WHERE id = p_skill_id;
END;
$$;

-- Return all user profiles joined with auth email. Only callable by an admin.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id          UUID,
  full_name   TEXT,
  email       TEXT,
  role        public.user_role,
  created_at  TIMESTAMPTZ,
  avatar_url  TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    au.email::TEXT,
    p.role,
    p.created_at,
    p.avatar_url
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
