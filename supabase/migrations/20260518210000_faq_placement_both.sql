-- Allow FAQ rows to appear on both marketing pages (home + how-it-works).

ALTER TABLE public.faq DROP CONSTRAINT IF EXISTS faq_placement_check;

ALTER TABLE public.faq
  ADD CONSTRAINT faq_placement_check
  CHECK (placement IN ('home', 'how_it_works', 'both'));
