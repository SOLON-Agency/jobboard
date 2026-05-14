-- ── Blog posts ────────────────────────────────────────────────────────────────

CREATE TABLE public.blog_posts (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text        NOT NULL UNIQUE
                                     CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title                  text        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  excerpt                text        CHECK (excerpt IS NULL OR char_length(excerpt) <= 300),
  cover_image_url        text,
  content_markdown       text        NOT NULL CHECK (char_length(content_markdown) > 0),
  status                 text        NOT NULL DEFAULT 'draft'
                                     CHECK (status IN ('draft', 'published', 'archived')),
  published_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  notified_at            timestamptz,
  author_id              uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  seo_title              text,
  seo_description        text,
  reading_time_minutes   integer     CHECK (reading_time_minutes IS NULL OR reading_time_minutes >= 0),
  tags                   text[]      NOT NULL DEFAULT '{}',
  canonical_url          text
);

CREATE INDEX blog_posts_slug_idx         ON public.blog_posts (slug);
CREATE INDEX blog_posts_published_at_idx ON public.blog_posts (published_at DESC NULLS LAST);
CREATE INDEX blog_posts_status_idx       ON public.blog_posts (status);
CREATE INDEX blog_posts_tags_gin         ON public.blog_posts USING gin (tags);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.blog_posts_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read: only published posts whose published_at is in the past
CREATE POLICY blog_posts_public_read
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

-- Admins can read everything (drafts, archived)
CREATE POLICY blog_posts_admin_read_all
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins may insert
CREATE POLICY blog_posts_admin_insert
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins may update
CREATE POLICY blog_posts_admin_update
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING     ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admins may delete
CREATE POLICY blog_posts_admin_delete
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
