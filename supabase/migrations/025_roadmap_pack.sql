-- 025: Roadmap pack (18 Jul 2026) - verification desk + WHC Verified badge,
-- insurance expiry chasing, referral credits, standing (weekly) shifts,
-- post-shift review requests. Idempotent, safe to re-run.

-- ── WHC Verified ──
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS whc_verified boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS whc_verified_at timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS verification_status text; -- pending/verified/rejected/lapsed
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS verification_docs jsonb;  -- [{name,url}]
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS verification_notes text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS insurance_expiry_date date;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS insurance_chased_at timestamptz;

-- ── Referral credits ──
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS candidate_referral_code_idx ON candidate_profiles (referral_code) WHERE referral_code IS NOT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  referred_candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- pending → converted (friend paid for the register)
  credit_applied boolean DEFAULT false, -- WHC applies the free month in Stripe manually
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  UNIQUE (referred_candidate_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY; -- service-role only

-- ── Standing (weekly repeat) shifts + post-shift review requests ──
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS booking_group uuid;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS review_requested boolean;

NOTIFY pgrst, 'reload schema';
