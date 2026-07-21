-- 027: Columns the Skills Wizard and profile settings write but the live
-- table never gained - their absence made the WHOLE step-1 update fail
-- silently, losing salary, languages and more on every visit (reported by
-- Rebecca 20 Jul). All idempotent.

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS right_to_work text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS employment_types_wanted text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS availability_date date;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS willing_to_relocate boolean;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS transport_method text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS max_commute text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS shift_preferences text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS location_preferences text[];
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS needs_accommodation boolean;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS stealth_mode boolean;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS job_alerts_enabled boolean;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS job_alerts_frequency text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS job_alerts_min_score integer;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS profile_completion_pct integer;

NOTIFY pgrst, 'reload schema';
