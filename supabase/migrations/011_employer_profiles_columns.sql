-- Fix employer_profiles missing columns
-- Run in Supabase SQL Editor

ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS property_name text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS star_rating text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS num_treatment_rooms integer;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS product_houses_used text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS systems_used text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS services_offered text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_notes text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified';

-- Reload schema cache so PostgREST sees the new columns
NOTIFY pgrst, 'reload schema';
