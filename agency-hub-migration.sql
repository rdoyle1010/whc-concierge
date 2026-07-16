-- Agency Hub migration - run in Supabase SQL editor (15 Jul 2026)
-- Safe to re-run: everything is IF NOT EXISTS / idempotent.
-- Part 1 (columns for register/urgency/commute) was applied 15 Jul evening.
-- Part 2 adds payments-through-WHC, geocoding and Preferred Employer.

-- Candidate agency register
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_available boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_tier text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_listed_until timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS travel_radius_miles integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- Employer commute info + Preferred Employer registration + geocoding
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS commute_car_required boolean;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS nearest_transport text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS preferred_employer boolean DEFAULT false;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS preferred_until timestamptz;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- Offer urgency, expiry, and payment-through-WHC tracking
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS fee_paid_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS amount_paid integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_amount integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_status text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_at timestamptz;

-- Grandfather existing approved accounts for the demo period so the
-- marketplace is not empty while subscriptions roll out.
UPDATE candidate_profiles
SET agency_available = true, agency_tier = COALESCE(agency_tier, 'basic')
WHERE approval_status = 'approved';

UPDATE employer_profiles
SET preferred_employer = true, preferred_until = now() + interval '1 year'
WHERE approval_status = 'approved';

-- Make PostgREST pick up the new columns immediately
NOTIFY pgrst, 'reload schema';
