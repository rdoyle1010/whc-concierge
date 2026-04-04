-- Fix taxonomy table RLS: ensure authenticated users can read all taxonomy data
-- This fixes the empty skills/systems/product_houses lists in the onboarding wizard

-- Skills
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read skills" ON skills;
DROP POLICY IF EXISTS "Anyone can read active skills" ON skills;
CREATE POLICY "Anyone can read active skills" ON skills FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Auth manage skills" ON skills;
CREATE POLICY "Auth manage skills" ON skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Systems
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read systems" ON systems;
DROP POLICY IF EXISTS "Anyone can read active systems" ON systems;
CREATE POLICY "Anyone can read active systems" ON systems FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Auth manage systems" ON systems;
CREATE POLICY "Auth manage systems" ON systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product houses
ALTER TABLE product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read product_houses" ON product_houses;
DROP POLICY IF EXISTS "Anyone can read active product_houses" ON product_houses;
CREATE POLICY "Anyone can read active product_houses" ON product_houses FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Auth manage product_houses" ON product_houses;
CREATE POLICY "Auth manage product_houses" ON product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Certifications
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read certifications" ON certifications;
DROP POLICY IF EXISTS "Anyone can read active certifications" ON certifications;
CREATE POLICY "Anyone can read active certifications" ON certifications FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Auth manage certifications" ON certifications;
CREATE POLICY "Auth manage certifications" ON certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Hotel brands
ALTER TABLE hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read hotel_brands" ON hotel_brands;
DROP POLICY IF EXISTS "Anyone can read active hotel_brands" ON hotel_brands;
CREATE POLICY "Anyone can read active hotel_brands" ON hotel_brands FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Auth manage hotel_brands" ON hotel_brands;
CREATE POLICY "Auth manage hotel_brands" ON hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Candidate join tables — ensure authenticated can read/write
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_skills" ON candidate_skills;
CREATE POLICY "Auth access candidate_skills" ON candidate_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_systems" ON candidate_systems;
CREATE POLICY "Auth access candidate_systems" ON candidate_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_product_houses" ON candidate_product_houses;
CREATE POLICY "Auth access candidate_product_houses" ON candidate_product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_certifications" ON candidate_certifications;
CREATE POLICY "Auth access candidate_certifications" ON candidate_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_hotel_brands" ON candidate_hotel_brands;
CREATE POLICY "Auth access candidate_hotel_brands" ON candidate_hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Job join tables
ALTER TABLE job_required_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_skills" ON job_required_skills;
CREATE POLICY "Auth access job_required_skills" ON job_required_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_preferred_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_preferred_skills" ON job_preferred_skills;
CREATE POLICY "Auth access job_preferred_skills" ON job_preferred_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_systems" ON job_required_systems;
CREATE POLICY "Auth access job_required_systems" ON job_required_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_product_houses" ON job_required_product_houses;
CREATE POLICY "Auth access job_required_product_houses" ON job_required_product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_certifications" ON job_required_certifications;
CREATE POLICY "Auth access job_required_certifications" ON job_required_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_hotel_brands" ON job_required_hotel_brands;
CREATE POLICY "Auth access job_required_hotel_brands" ON job_required_hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reload schema
NOTIFY pgrst, 'reload schema';
