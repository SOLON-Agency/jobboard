-- ── Newsletter subscribers ────────────────────────────────────────────────────

CREATE TABLE public.newsletter_subscribers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        NOT NULL UNIQUE
                              CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_active       boolean     NOT NULL DEFAULT true,
  source          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE INDEX newsletter_subscribers_active_idx
  ON public.newsletter_subscribers (is_active)
  WHERE is_active;

CREATE INDEX newsletter_subscribers_created_at_idx
  ON public.newsletter_subscribers (created_at DESC);

CREATE OR REPLACE FUNCTION public.newsletter_subscribers_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_subscribers_set_updated_at();

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone may subscribe (INSERT only; no SELECT/UPDATE/DELETE for anon/regular users)
CREATE POLICY newsletter_subscribers_public_insert
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins may read all subscribers
CREATE POLICY newsletter_subscribers_admin_select
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins may update (e.g. set is_active = false for unsubscribe)
CREATE POLICY newsletter_subscribers_admin_update
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING     ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admins may delete
CREATE POLICY newsletter_subscribers_admin_delete
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
