-- Job storytelling: narrative columns for job_listings so a role page reads
-- like the story of a job rather than a list of bullet points. All optional,
-- written by the employer when posting: why the role exists, what success
-- looks like, who it reports to, the commercial reality (KPIs, membership,
-- opening hours), the honest pitch for moving, and the interview process.

ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS reporting_line text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS opening_hours text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS commercial_responsibility text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS membership_size text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS key_kpis text[];
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS success_90_days text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS why_role_exists text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS why_move text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS career_progression text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS interview_process text;
