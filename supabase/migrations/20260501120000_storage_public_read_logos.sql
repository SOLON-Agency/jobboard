-- Public read access for company logo objects (anonymous job/company pages).
-- Dashboard uses bucket `logos`; legacy wizard data may use `company-logos`.
-- Idempotent policy names for repeat applies.

DROP POLICY IF EXISTS "jobboard_public_select_logos" ON storage.objects;
CREATE POLICY "jobboard_public_select_logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "jobboard_public_select_company_logos" ON storage.objects;
CREATE POLICY "jobboard_public_select_company_logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');
