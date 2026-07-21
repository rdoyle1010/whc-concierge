-- 028: Sweep columns (21 Jul 2026) - columns the UI already writes but no
-- migration ever created. employer_profiles gains the agency opt-in fields
-- and the property photo gallery; candidate_profiles gains the onboarding
-- wizard's Country field. Idempotent.

ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS agency_available boolean DEFAULT false;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS agency_note text;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS property_photos text[];

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS location_country text DEFAULT 'United Kingdom';

NOTIFY pgrst, 'reload schema';
