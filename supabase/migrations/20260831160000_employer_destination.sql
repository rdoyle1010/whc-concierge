-- Employer destination page: two new narrative columns for the public
-- property profile. Both are optional prose supplied by the employer.

-- What the area is like to live and work in, written by the property.
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location_guide text;

-- What the property offers people relocating for a role there.
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS relocation_support text;
