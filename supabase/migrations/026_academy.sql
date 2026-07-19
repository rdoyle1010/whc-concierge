-- 026: WHC Academy (18 Jul 2026) - paid £10 courses with certificates.
-- Course content lives in code (src/lib/academy.ts); this table holds
-- enrolments, progress, quiz results and certificates. Idempotent.

CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  course_slug text NOT NULL,
  paid_at timestamptz,
  amount_paid integer,
  progress jsonb,            -- { lesson_index: true } map of completed lessons
  quiz_score integer,        -- best score, percent
  completed_at timestamptz,  -- set when quiz passed at 80%+
  certificate_code text,     -- printed on the certificate, verifiable
  created_at timestamptz DEFAULT now(),
  UNIQUE (candidate_id, course_slug)
);
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
-- Writes are service-role only. The public may read COMPLETED enrolments so
-- the directory and profiles can show earned badges; progress stays private.
DROP POLICY IF EXISTS pub_read_completed_courses ON course_enrollments;
CREATE POLICY pub_read_completed_courses ON course_enrollments
  FOR SELECT USING (completed_at IS NOT NULL);

NOTIFY pgrst, 'reload schema';
