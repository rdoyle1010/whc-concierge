-- Agency Hub migration - run in Supabase SQL editor (15 Jul 2026)
-- Safe to re-run: everything is IF NOT EXISTS / idempotent.

-- Candidate agency register
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_available boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_tier text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_listed_until timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS travel_radius_miles integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Employer commute info (shown on every shift offer)
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS commute_car_required boolean;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS nearest_transport text;

-- Offer urgency + expiry
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Grandfather existing approved candidates onto the register so the
-- directory is not empty while the subscription rolls out.
UPDATE candidate_profiles
SET agency_available = true, agency_tier = COALESCE(agency_tier, 'basic')
WHERE approval_status = 'approved';

-- Make PostgREST pick up the new columns immediately
NOTIFY pgrst, 'reload schema';
