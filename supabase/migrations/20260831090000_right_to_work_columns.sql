-- Right-to-work columns on candidate_profiles.
-- The verification submit API has been writing to these columns since the
-- verification page shipped, but they were never created - so every
-- submission failed and nothing ever reached the admin review queue.
-- All additive and idempotent.

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_uk boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_ireland boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_status text DEFAULT 'not_submitted'; -- not_submitted / pending / approved / rejected
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_document_url text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_expiry_date date;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_verified_at timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work_notes text;
