-- Private Career Mode (20260831190000)
-- Senior professionals can appear to employers anonymised - first name and
-- initial, no photograph - and employers must request a confidential
-- introduction which the candidate approves before their identity is shown.
-- All application code selects and writes these columns with a
-- retry-without-column fallback, so nothing breaks before this runs.

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS private_mode boolean DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS private_hide_photo boolean DEFAULT false;
