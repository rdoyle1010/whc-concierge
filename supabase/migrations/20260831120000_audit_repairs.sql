-- Full-site audit repairs. All additive and idempotent.

-- 1. Mutual matching: the code writes these columns on matches but they were
-- never created, so every employer/talent "Interested" click failed and no
-- match was ever recorded.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS job_listing_id uuid;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_score integer;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS candidate_swiped_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS employer_swiped_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS matched_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS messaging_unlocked boolean DEFAULT false;

-- 2. Residency listings: the admin Feature control writes a column that
-- never existed.
ALTER TABLE residency_profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 3. Employer profile: qualifications sought were being saved into the
-- brand_partners column by mistake; give them their own home.
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS qualifications_sought text[] DEFAULT '{}';
