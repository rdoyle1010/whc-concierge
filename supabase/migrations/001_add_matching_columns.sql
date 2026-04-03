-- WHC Concierge Schema Additions for Matching Engine, Payments, Approvals
-- Run this in Supabase SQL Editor

-- candidate_profiles additions
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS role_level text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS product_houses text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS qualifications text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS systems_experience text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS has_insurance boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS insurance_document_url text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS certificates_urls text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS travel_availability text DEFAULT 'uk_only';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS travel_radius_miles integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS has_car boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS day_rate_min integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS day_rate_max integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'immediately';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS approval_notes text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS featured_until timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS profile_completion_score integer DEFAULT 0;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS review_score numeric DEFAULT 0;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_email text;

-- employer_profiles additions
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS product_houses_used text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS systems_used text[];
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS approval_notes text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS postcode text;

-- job_listings additions
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS required_role_level text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS required_product_houses text[];
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS required_qualifications text[];
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS required_systems text[];
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS location_postcode text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS radius_miles integer;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'permanent';
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_agency_role boolean DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_residency_role boolean DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS insurance_required boolean DEFAULT false;

-- agency_bookings additions
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS commission_amount integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS commission_paid boolean DEFAULT false;

-- residency_profiles table
CREATE TABLE IF NOT EXISTS residency_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  duration text,
  day_rate integer,
  weekly_rate integer,
  monthly_rate integer,
  services_offered text[],
  product_houses text[],
  availability_start date,
  availability_end date,
  travel_availability text DEFAULT 'uk_only',
  photos text[],
  video_url text,
  approval_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- residency_applications table
CREATE TABLE IF NOT EXISTS residency_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  experience text,
  specialisms text,
  motivation text,
  availability text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- message_threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid REFERENCES auth.users(id),
  participant_2 uuid REFERENCES auth.users(id),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- platform_config table
CREATE TABLE IF NOT EXISTS platform_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- contact_queries table
CREATE TABLE IF NOT EXISTS contact_queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  subject text,
  message text,
  type text DEFAULT 'general',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- Storage buckets
-- Run in Supabase Dashboard > Storage:
-- Create bucket 'talent-documents' (private)
-- Create bucket 'site-images' (public)
