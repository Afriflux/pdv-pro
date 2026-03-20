-- scripts/setup_rls.sql

-- 1. TABLE ProductQuestion
ALTER TABLE "public"."ProductQuestion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view questions" ON "public"."ProductQuestion";
CREATE POLICY "Public can view questions" 
ON "public"."ProductQuestion" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert questions" ON "public"."ProductQuestion";
CREATE POLICY "Authenticated users can insert questions" 
ON "public"."ProductQuestion" FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Vendor can update their product's questions" ON "public"."ProductQuestion";
CREATE POLICY "Vendor can update their product's questions" 
ON "public"."ProductQuestion" FOR UPDATE TO authenticated 
USING (
  auth.uid()::text IN (
    SELECT s.user_id 
    FROM "public"."Store" s 
    JOIN "public"."Product" p ON p.store_id = s.id 
    WHERE p.id = "ProductQuestion".product_id
  )
) WITH CHECK (
  auth.uid()::text IN (
    SELECT s.user_id 
    FROM "public"."Store" s 
    JOIN "public"."Product" p ON p.store_id = s.id 
    WHERE p.id = "ProductQuestion".product_id
  )
);

-- 2. TABLE Review
ALTER TABLE "public"."Review" ADD COLUMN IF NOT EXISTS "user_id" UUID;
ALTER TABLE "public"."Review" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON "public"."Review";
CREATE POLICY "Public can view reviews" 
ON "public"."Review" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON "public"."Review";
CREATE POLICY "Authenticated users can insert reviews" 
ON "public"."Review" FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own reviews" ON "public"."Review";
CREATE POLICY "Users can update their own reviews" 
ON "public"."Review" FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON "public"."Review";
CREATE POLICY "Users can delete their own reviews" 
ON "public"."Review" FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- 3. TABLE Complaint
ALTER TABLE "public"."Complaint" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view complaints" ON "public"."Complaint";
CREATE POLICY "Admins can view complaints" 
ON "public"."Complaint" FOR SELECT TO authenticated 
USING (
  (SELECT role FROM "public"."User" WHERE id = auth.uid()::text) IN ('super_admin', 'gestionnaire')
);

DROP POLICY IF EXISTS "Authenticated users can insert complaints" ON "public"."Complaint";
CREATE POLICY "Authenticated users can insert complaints" 
ON "public"."Complaint" FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update complaints" ON "public"."Complaint";
CREATE POLICY "Admins can update complaints" 
ON "public"."Complaint" FOR UPDATE TO authenticated 
USING (
  (SELECT role FROM "public"."User" WHERE id = auth.uid()::text) IN ('super_admin', 'gestionnaire')
) WITH CHECK (
  (SELECT role FROM "public"."User" WHERE id = auth.uid()::text) IN ('super_admin', 'gestionnaire')
);

-- 4. STORAGE BUCKET "reviews"

DROP POLICY IF EXISTS "Public reviews viewing" ON storage.objects;
CREATE POLICY "Public reviews viewing" 
ON storage.objects FOR SELECT TO public USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "Authenticated reviews uploading" ON storage.objects;
CREATE POLICY "Authenticated reviews uploading" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reviews');
