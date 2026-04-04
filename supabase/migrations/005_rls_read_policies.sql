-- 005: Ensure public read access to key tables
-- Run in Supabase SQL Editor

-- Job listings: authenticated full access, anon read live jobs
DROP POLICY IF EXISTS "Public read jobs" ON job_listings;
CREATE POLICY "Public read jobs" ON job_listings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anon read live jobs" ON job_listings;
CREATE POLICY "Anon read live jobs" ON job_listings FOR SELECT TO anon USING (is_live = true);

-- Employer profiles: readable by all
DROP POLICY IF EXISTS "Public read employers" ON employer_profiles;
CREATE POLICY "Public read employers" ON employer_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anon read employers" ON employer_profiles;
CREATE POLICY "Anon read employers" ON employer_profiles FOR SELECT TO anon USING (true);

-- Candidate profiles: readable by authenticated
DROP POLICY IF EXISTS "Public read candidates" ON candidate_profiles;
CREATE POLICY "Public read candidates" ON candidate_profiles FOR SELECT TO authenticated USING (true);

-- Residency profiles: readable by all
DROP POLICY IF EXISTS "Public read residencies" ON residency_profiles;
CREATE POLICY "Public read residencies" ON residency_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anon read residencies" ON residency_profiles;
CREATE POLICY "Anon read residencies" ON residency_profiles FOR SELECT TO anon USING (approval_status = 'approved');

-- Reviews: readable
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT TO authenticated USING (true);
