-- ── company_favourites ────────────────────────────────────────────────────────
-- Stores a candidate's saved/favourited companies.
-- Composite PK (user_id, company_id) prevents duplicates without a serial id.

CREATE TABLE IF NOT EXISTS public.company_favourites (
  user_id    uuid        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  company_id uuid        NOT NULL REFERENCES public.companies(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE public.company_favourites ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own favourites.
DROP POLICY IF EXISTS "Users manage their own company favourites" ON public.company_favourites;
CREATE POLICY "Users manage their own company favourites"
  ON public.company_favourites
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for "get all companies favourited by user" queries.
CREATE INDEX IF NOT EXISTS company_favourites_user_id_idx
  ON public.company_favourites (user_id, created_at DESC);
