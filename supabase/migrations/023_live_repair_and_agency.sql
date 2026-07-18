-- 023: Consolidated record of live changes applied via the SQL editor,
-- 15-16 Jul 2026. Everything here is idempotent and safe to re-run.
--
-- NOTE (historical, not reproduced here as DDL): on 15 Jul the live
-- applications, messages, profiles, reviews and agency_bookings tables were
-- repaired/rebuilt in place (FKs re-pointed to candidate_profiles /
-- employer_profiles, status CHECKs modernised, messages.thread_id made
-- nullable, profiles backfilled with role 'candidate'). Those repairs predate
-- this file and are documented in the project status notes.

-- ── Reviews (15-16 Jul) ──
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS review_score numeric;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS review_count integer;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS review_score numeric;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS review_count integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id uuid; -- per-shift reviews

-- ── Agency register + urgency + commute (15 Jul eve) ──
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS hourly_rate integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_available boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_tier text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS agency_listed_until timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS travel_radius_miles integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS commute_car_required boolean;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS nearest_transport text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ── Payments through WHC + geocoding + Preferred Employer (16 Jul) ──
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS preferred_employer boolean DEFAULT false;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS preferred_until timestamptz;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS fee_paid_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS amount_paid integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_amount integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_status text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS payout_at timestamptz;

-- ── Disputes / refunds (16 Jul) ──
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_status text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_reason text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_requested text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS refund_amount integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

-- ── Admin content tables + hardening (16 Jul eve) ──
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text, content text, excerpt text, image_url text,
  author text, category text, tags text[], status text DEFAULT 'draft',
  published_at timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags text[];
CREATE TABLE IF NOT EXISTS site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text UNIQUE, label text, image_url text, heading text, subtext text,
  sort_order integer DEFAULT 0, active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text, description text, type text, status text DEFAULT 'draft',
  start_date date, end_date date, target_audience text, content text,
  sent_at timestamptz, recipients_count integer, created_at timestamptz DEFAULT now()
);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipients_count integer;

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pub_read_published ON blog_posts;
CREATE POLICY pub_read_published ON blog_posts FOR SELECT USING (status = 'published');
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pub_read_site_images ON site_images;
CREATE POLICY pub_read_site_images ON site_images FOR SELECT USING (true);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;      -- service-role only
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY; -- service-role only
ALTER TABLE contact_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anyone_can_enquire ON contact_queries;
CREATE POLICY anyone_can_enquire ON contact_queries FOR INSERT WITH CHECK (true);

-- ── Taxonomy write tightening (16 Jul eve) ──
-- Reads stay public (is_active = true, from 021); WRITES now only via the
-- service-role admin API. The old policies let any signed-in user edit.
DROP POLICY IF EXISTS "Auth manage skills" ON skills;
DROP POLICY IF EXISTS "Auth manage systems" ON systems;
DROP POLICY IF EXISTS "Auth manage product_houses" ON product_houses;
DROP POLICY IF EXISTS "Auth manage certifications" ON certifications;
DROP POLICY IF EXISTS "Auth manage hotel_brands" ON hotel_brands;

-- ── Legacy cleanup ──
DROP TABLE IF EXISTS shift_ratings CASCADE;

-- Demo-period grandfathering (idempotent)
UPDATE candidate_profiles SET agency_available = true, agency_tier = COALESCE(agency_tier, 'basic') WHERE approval_status = 'approved' AND agency_listed_until IS NULL;
UPDATE employer_profiles SET preferred_employer = true, preferred_until = COALESCE(preferred_until, now() + interval '1 year') WHERE approval_status = 'approved';

NOTIFY pgrst, 'reload schema';

-- ── Overhaul sweep fixes (16 Jul eve): missing tables + bucket ──
CREATE TABLE IF NOT EXISTS shortlisted_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES employer_profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_id uuid, notes text, created_at timestamptz DEFAULT now(),
  UNIQUE (employer_id, candidate_id, job_id)
);
ALTER TABLE shortlisted_candidates ENABLE ROW LEVEL SECURITY; -- service-role only
CREATE TABLE IF NOT EXISTS profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  blocked_employer_id uuid REFERENCES employer_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, blocked_employer_id)
);
ALTER TABLE profile_blocks ENABLE ROW LEVEL SECURITY; -- service-role only
ALTER TABLE residency_profiles ADD COLUMN IF NOT EXISTS day_rate integer;
ALTER TABLE residency_profiles ADD COLUMN IF NOT EXISTS monthly_rate integer;
ALTER TABLE residency_profiles ADD COLUMN IF NOT EXISTS negotiable boolean;
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments','message-attachments', true) ON CONFLICT (id) DO NOTHING;

-- Legacy messaging remnant (zero code references)
DROP TABLE IF EXISTS message_threads CASCADE;
