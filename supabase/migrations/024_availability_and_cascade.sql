-- 024: Availability calendar + urgent offer cascade (18 Jul 2026).
-- Idempotent, safe to re-run.

-- Therapist availability: one row per candidate per date they have explicitly
-- marked. available=true → "I can work this day" (front of the urgent queue);
-- available=false → "don't offer me this day". No row = unspecified (still
-- eligible for urgent offers, ranked after the explicitly available).
CREATE TABLE IF NOT EXISTS agency_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, date)
);
ALTER TABLE agency_availability ENABLE ROW LEVEL SECURITY;
-- Writes are service-role only. Public may read AVAILABLE days only, so the
-- directory can show an "Available today" badge; unavailability stays private.
DROP POLICY IF EXISTS pub_read_available_days ON agency_availability;
CREATE POLICY pub_read_available_days ON agency_availability FOR SELECT USING (available = true);

-- Urgent cascade: the offer walks down a distance-sorted queue of available
-- therapists until someone accepts. Queue is a jsonb array of
-- {id, name, rate, distance} captured at creation; cascade_index is who
-- currently holds the offer; cascade_deadline is their response window
-- (mirrored into expires_at so countdowns and the sweep behave).
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS cascade_queue jsonb;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS cascade_index integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS cascade_deadline timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS cascade_notes text;

NOTIFY pgrst, 'reload schema';
