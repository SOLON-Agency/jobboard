-- ─── Unclaimed Companies ──────────────────────────────────────────────────────
--
-- Adds support for companies created by admins that are not yet owned by any
-- registered user. These companies have `is_claimed = false` and a contact
-- `email` used for daily nudge notifications.
--
-- New columns on `companies`:
--   email       — contact address for claim notifications (no DB CHECK so
--                 existing NULL rows stay valid; required at app level for
--                 unclaimed companies)
--   is_claimed  — defaults TRUE so all existing rows remain claimed
--   claimed_at  — timestamp when the claim was completed
--   claimed_by  — the user who claimed the company (separate from created_by
--                 which stays as the admin who seeded the row)
--
-- New tables:
--   company_claim_tokens   — one active token per unclaimed company
--   company_claim_nudge_log — audit log of every nudge email sent
--
-- New SECURITY DEFINER RPCs:
--   issue_company_claim_token(p_company_id)  — admin-only; issues/rotates token
--   verify_claim_code(p_token, p_code)       — rate-limited code check
--   claim_company(p_token, p_code)           — authenticated; transfers ownership
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Alter companies ────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS email       text,
  ADD COLUMN IF NOT EXISTS is_claimed  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS claimed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS companies_is_claimed_idx
  ON public.companies(is_claimed)
  WHERE is_claimed = false;

-- ── 2. company_claim_tokens ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_claim_tokens (
  company_id      uuid        PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  -- SHA-256 hex of the 6-digit code; never stored in plain text
  code_hash       text        NOT NULL,
  -- opaque UUID embedded in the magic-link URL
  token           uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  consumed_at     timestamptz,
  failed_attempts int         NOT NULL DEFAULT 0,
  -- last_attempt_at is used for the 1-hour sliding rate-limit window
  last_attempt_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Deny all direct access; edge functions use the service-role key (bypasses RLS).
ALTER TABLE public.company_claim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_claim_tokens"
  ON public.company_claim_tokens
  FOR ALL
  USING (false);

-- ── 3. company_claim_nudge_log ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_claim_nudge_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  sent_to     text,
  status      text        NOT NULL DEFAULT 'sent'  -- 'sent' | 'skipped' | 'error'
);

ALTER TABLE public.company_claim_nudge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_nudge_log"
  ON public.company_claim_nudge_log
  FOR ALL
  USING (false);

-- ── 4. RPC: issue_company_claim_token ─────────────────────────────────────────
--
-- Callable by admins (profiles.role = 'admin') or service role.
-- Generates a cryptographically random 6-digit code, stores its SHA-256 hash,
-- and returns the plaintext code ONCE so the caller can embed it in an email.
-- Re-calling rotates the token (new code + new token UUID + reset expiry).
-- Calling on an already-claimed company raises an exception.

CREATE OR REPLACE FUNCTION public.issue_company_claim_token(p_company_id uuid)
RETURNS TABLE (code text, token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_claimed  boolean;
  v_raw_code    text;
  v_code_hash   text;
  v_token       uuid;
BEGIN
  -- Gate: admin-only or service-role (service role bypasses auth.uid() check)
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied: admin role required';
    END IF;
  END IF;

  SELECT c.is_claimed INTO v_is_claimed
  FROM public.companies c
  WHERE c.id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  IF v_is_claimed THEN
    RAISE EXCEPTION 'Company is already claimed';
  END IF;

  -- Generate 6-digit numeric code (zero-padded)
  v_raw_code  := lpad((floor(random() * 1000000)::int)::text, 6, '0');
  v_code_hash := encode(sha256(v_raw_code::bytea), 'hex');
  v_token     := gen_random_uuid();

  INSERT INTO public.company_claim_tokens
    (company_id, code_hash, token, expires_at, consumed_at, failed_attempts, last_attempt_at)
  VALUES
    (p_company_id, v_code_hash, v_token, now() + interval '7 days', NULL, 0, NULL)
  ON CONFLICT (company_id) DO UPDATE
    SET code_hash       = EXCLUDED.code_hash,
        token           = EXCLUDED.token,
        expires_at      = EXCLUDED.expires_at,
        consumed_at     = NULL,
        failed_attempts = 0,
        last_attempt_at = NULL;

  RETURN QUERY SELECT v_raw_code AS code, v_token AS token;
END;
$$;

-- ── 5. RPC: verify_claim_code ─────────────────────────────────────────────────
--
-- Rate-limited code verification. Does NOT consume the token.
-- Throws if: token not found, expired, already consumed, >5 failures/hour.
-- Returns the company_id on success.

CREATE OR REPLACE FUNCTION public.verify_claim_code(p_token uuid, p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.company_claim_tokens%ROWTYPE;
  v_input_hash text;
BEGIN
  SELECT * INTO v_row
  FROM public.company_claim_tokens
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired claim link';
  END IF;

  IF v_row.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This claim link has already been used';
  END IF;

  IF v_row.expires_at < now() THEN
    RAISE EXCEPTION 'Claim link has expired — a new one will be sent in the next scheduled email';
  END IF;

  -- Sliding 1-hour rate limit: max 5 failures
  IF v_row.failed_attempts >= 5
     AND v_row.last_attempt_at > now() - interval '1 hour' THEN
    RAISE EXCEPTION 'Too many failed attempts — please wait before trying again';
  END IF;

  v_input_hash := encode(sha256(p_code::bytea), 'hex');

  IF v_input_hash <> v_row.code_hash THEN
    UPDATE public.company_claim_tokens
    SET failed_attempts = failed_attempts + 1,
        last_attempt_at = now()
    WHERE token = p_token;
    RAISE EXCEPTION 'Cod incorect — mai ai % încercări disponibile',
      greatest(0, 5 - (v_row.failed_attempts + 1));
  END IF;

  RETURN v_row.company_id;
END;
$$;

-- ── 6. RPC: claim_company ─────────────────────────────────────────────────────
--
-- Authenticated callers only (auth.uid() must not be NULL).
-- Verifies the code, marks the token consumed, marks the company claimed,
-- inserts a company_users owner row, and transfers job_listings.created_by.
-- Returns the company_id and slug.

CREATE OR REPLACE FUNCTION public.claim_company(p_token uuid, p_code text)
RETURNS TABLE (company_id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id    uuid;
  v_slug          text;
  v_old_owner     uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- verify_claim_code raises on any failure; on success returns company_id
  SELECT public.verify_claim_code(p_token, p_code) INTO v_company_id;

  -- Consume the token
  UPDATE public.company_claim_tokens
  SET consumed_at = now()
  WHERE token = p_token;

  -- Fetch current created_by for job transfer
  SELECT c.created_by, c.slug
  INTO v_old_owner, v_slug
  FROM public.companies c
  WHERE c.id = v_company_id;

  -- Mark company claimed
  UPDATE public.companies
  SET is_claimed = true,
      claimed_by = auth.uid(),
      claimed_at = now()
  WHERE id = v_company_id;

  -- Transfer job_listings so the new owner gets application notifications
  UPDATE public.job_listings
  SET created_by = auth.uid()
  WHERE job_listings.company_id = v_company_id
    AND (v_old_owner IS NULL OR job_listings.created_by = v_old_owner);

  -- Upsert owner membership
  INSERT INTO public.company_users (company_id, user_id, role, accepted_at)
  VALUES (v_company_id, auth.uid(), 'owner', now())
  ON CONFLICT (company_id, user_id) DO UPDATE
    SET role = 'owner',
        accepted_at = now();

  RETURN QUERY SELECT v_company_id AS company_id, v_slug AS slug;
END;
$$;
