-- Employer & candidate intelligence fields (30 Aug 2026).
-- Run in the Supabase SQL Editor. Idempotent - safe to run twice.

-- Employer intelligence: the property details that make a candidate say yes.
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS hotel_group text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS room_count integer;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS spa_size text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS facilities text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS opening_year integer;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS culture_statement text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS staff_benefits text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS progression_notes text;

-- Candidate intelligence: commercial depth and direction of travel.
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS salary_expectation_min integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS salary_expectation_max integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS commercial_experience text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS revenue_responsibility text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS team_size_managed integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS desired_roles text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS portfolio_url text;

NOTIFY pgrst, 'reload schema';
