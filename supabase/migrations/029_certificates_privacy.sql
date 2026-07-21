-- 029: Certificate privacy (21 Jul 2026). The public SELECT policy on
-- course_enrollments exposed EVERY column of completed rows - anon clients
-- could read progress, quiz_score, amount_paid and paid_at for each learner.
-- Column-level privileges now limit anon/authenticated reads to the fields
-- the public actually needs: the agency directory and profile badge lookups
-- (candidate_id, course_slug, completed_at) and the /verify certificate
-- lookup (certificate_code, course_slug, completed_at, candidate_id).
-- The row policy (completed rows only) is unchanged; writes remain
-- service-role only. Idempotent.

REVOKE SELECT ON course_enrollments FROM anon, authenticated;
GRANT SELECT (id, candidate_id, course_slug, completed_at, certificate_code)
  ON course_enrollments TO anon, authenticated;

-- Recreate the row policy so this migration stands alone: only completed
-- enrolments are ever visible to the public.
DROP POLICY IF EXISTS pub_read_completed_courses ON course_enrollments;
CREATE POLICY pub_read_completed_courses ON course_enrollments
  FOR SELECT USING (completed_at IS NOT NULL);

NOTIFY pgrst, 'reload schema';
