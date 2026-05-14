-- Fix blog_posts.author_id FK: point to public.profiles instead of auth.users
-- so PostgREST can resolve the embedded join for author name / avatar.

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
