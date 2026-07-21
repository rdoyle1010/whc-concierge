-- 030: Saved jobs (21 Jul 2026). The live table already existed (created via
-- the SQL editor as 'Saved Job Bookmarks') keyed on candidate_id - this
-- migration records it and hardens it: uniqueness per candidate/job, RLS
-- enabled, owner-read policy. Writes go through the service-role API route
-- (/api/saved-jobs), which resolves candidate_id from the session. Idempotent.

CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS saved_jobs_candidate_job_uq ON saved_jobs (candidate_id, job_id);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_saved_jobs ON saved_jobs;
CREATE POLICY own_saved_jobs ON saved_jobs
  FOR SELECT USING (candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
