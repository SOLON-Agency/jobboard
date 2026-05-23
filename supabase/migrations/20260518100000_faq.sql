-- ── FAQ (marketing pages: home, how-it-works) ─────────────────────────────────

CREATE TABLE public.faq (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  placement   text        NOT NULL CHECK (placement IN ('home', 'how_it_works')),
  question    text        NOT NULL CHECK (char_length(trim(question)) > 0),
  answer      text        NOT NULL CHECK (char_length(trim(answer)) > 0),
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX faq_placement_sort_idx ON public.faq (placement, sort_order);
CREATE INDEX faq_placement_active_idx ON public.faq (placement, is_active);

CREATE OR REPLACE FUNCTION public.faq_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER faq_updated_at
  BEFORE UPDATE ON public.faq
  FOR EACH ROW EXECUTE FUNCTION public.faq_set_updated_at();

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY faq_public_read
  ON public.faq
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY faq_admin_select
  ON public.faq
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY faq_admin_insert
  ON public.faq
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY faq_admin_update
  ON public.faq
  FOR UPDATE
  TO authenticated
  USING     ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY faq_admin_delete
  ON public.faq
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Seed (matches former static copy in FaqSection / HowItWorksContent)
INSERT INTO public.faq (placement, question, answer, sort_order) VALUES
('home', $$Cui se adresează JurisJobs?$$, $$JurisJobs este construit exclusiv pentru piața juridică din România: cabinete și societăți de avocatură, departamente juridice in-house, avocați definitivi, stagiari, consilieri juridici și agenții de recrutare specializate.$$ , 0),
('home', $$Cât costă publicarea unui anunț?$$, $$Publicarea anunțurilor este gratuită pentru primele 5 roluri active simultan. Nu cerem card de credit, nu impunem perioade de probă limitate și nu există costuri ascunse pentru funcționalitățile de bază.$$ , 1),
('home', $$Ce înseamnă matchmaking inteligent în context juridic?$$, $$Platforma corelează specializarea, vechimea, jurisdicția și competențele candidaților cu cerințele explicite ale fiecărui anunț. Rezultatul este un set restrâns de potriviri relevante pentru fiecare parte — fără a forța algoritmul pe candidați care nu se aliniază profilului.$$ , 2),
('home', $$Cum sunt protejate datele cu caracter personal?$$, $$Toate datele sunt prelucrate strict conform GDPR. Profesioniștii juridici controlează vizibilitatea profilului, beneficiază de drepturi clare de acces, rectificare și ștergere, iar datele sensibile sunt stocate într-o infrastructură securizată, conformă cu standardele europene.$$ , 3),
('home', $$Cum funcționează alertele personalizate?$$, $$Îți salvezi criteriile (specializare, locație, nivel de experiență, interval salarial) și primești notificări prin e-mail și în browser imediat ce apare un anunț relevant. Astfel poți reacționa rapid, înainte ca poziția să devină saturată cu aplicații.$$ , 4),
('home', $$Pot publica anunțuri confidențial pentru clienții mei?$$, $$Da. Agențiile de recrutare și consultanții pot publica anunțuri folosind brandul propriu sau cu informații parțial confidențiale despre clientul final. Discutăm la cerere setări avansate de confidențialitate pentru rolurile sensibile.$$ , 5),
('home', $$Pot edita sau retrage un anunț după publicare?$$, $$Anunțurile pot fi editate, arhivate sau republicate oricând din dashboard-ul de angajator. Modificările sunt reflectate imediat pentru candidați, iar istoricul aplicațiilor este păstrat pentru continuitate.$$ , 6),
('home', $$În cât timp pot publica primul anunț?$$, $$Crearea contului, configurarea profilului de companie și publicarea primului anunț durează în medie sub 10 minute. Echipa noastră de suport te asistă activ pentru ca primul tău anunț să fie optimizat pentru conversie.$$ , 7),

('how_it_works', $$Este platforma gratuită pentru candidați?$$, $$Da, complet gratuit. Creezi cont, îți completezi profilul și aplici la oricâte posturi dorești fără nicio taxă.$$ , 0),
('how_it_works', $$Cum funcționează alertele de joburi?$$, $$Salvezi un set de filtre (locație, tip contract, nivel experiență, salariu, etc.) și primești un email sau SMS automat de fiecare dată când apare un post nou care se potrivește.$$ , 1),
('how_it_works', $$Pot urmări statusul aplicațiilor mele?$$, $$Da. Din dashboard-ul tău vezi toate candidaturile trimise, data aplicării și statusul fiecăreia.$$ , 2),
('how_it_works', $$Cum postez un anunț ca angajator?$$, $$Creezi un cont de companie, completezi profilul firmei și publici primul anunț gratuit. Planurile premium oferă vizibilitate crescută și funcții avansate.$$ , 3),
('how_it_works', $$Datele mele sunt în siguranță?$$, $$Folosim criptare end-to-end și nu vindem datele tale unor terți. Respectăm pe deplin GDPR.$$ , 4);
