-- 20260901200000: Erasure stops destroying the records law requires kept.
--
-- Additive and idempotent. Safe to run more than once. No data is deleted by
-- this migration; it only changes what happens on a future deletion.
--
-- WHY
--
-- residency_bookings.residency_profile_id is NOT NULL and cascades from
-- residency_profiles. Account deletion deleted the residency profile and then
-- tried to anonymise the bookings - by which point the bookings were already
-- gone, so the anonymise matched zero rows, returned no error, and the user
-- was told their financial records had been kept for six years while they
-- were being destroyed.
--
-- 20260901120000_data_retention.sql fixed employer_id and created_by on the
-- same table and missed residency_profile_id, which is the one that actually
-- fires. course_enrollments.candidate_id has the same shape: NOT NULL and
-- cascading, so deleting the candidate profile took every paid enrolment and
-- its certificate with it.
--
-- The route now anonymises before it deletes, and refuses to delete a parent
-- whose records could not be detached. This migration makes that possible by
-- letting the links be nulled at all.

DO $$
DECLARE
  target record;
  constraint_row record;
  column_attnum smallint;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('residency_bookings', 'residency_profile_id'),
      ('course_enrollments', 'candidate_id')
    ) AS t(table_name, column_name)
  LOOP
    IF to_regclass('public.' || target.table_name) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT attnum INTO column_attnum
    FROM pg_attribute
    WHERE attrelid = ('public.' || target.table_name)::regclass
      AND attname = target.column_name
      AND NOT attisdropped;
    IF column_attnum IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', target.table_name, target.column_name);

    -- Drop any foreign key on this column that is not already SET NULL.
    FOR constraint_row IN
      SELECT conname, confdeltype
      FROM pg_constraint
      WHERE conrelid = ('public.' || target.table_name)::regclass
        AND contype = 'f'
        AND conkey = ARRAY[column_attnum]::smallint[]
    LOOP
      IF constraint_row.confdeltype <> 'n' THEN
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', target.table_name, constraint_row.conname);
      END IF;
    END LOOP;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.residency_bookings') IS NOT NULL
     AND to_regclass('public.residency_profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.residency_bookings'::regclass
         AND conname = 'residency_bookings_profile_set_null_fkey'
     ) THEN
    ALTER TABLE public.residency_bookings
      ADD CONSTRAINT residency_bookings_profile_set_null_fkey
      FOREIGN KEY (residency_profile_id) REFERENCES public.residency_profiles(id) ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.course_enrollments') IS NOT NULL
     AND to_regclass('public.candidate_profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.course_enrollments'::regclass
         AND conname = 'course_enrollments_candidate_set_null_fkey'
     ) THEN
    ALTER TABLE public.course_enrollments
      ADD CONSTRAINT course_enrollments_candidate_set_null_fkey
      FOREIGN KEY (candidate_id) REFERENCES public.candidate_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- residency_profiles.user_id had no ON DELETE action at all, so a row that
-- the deletion route could not find by candidate_profile_id blocked the auth
-- user deletion outright - an erasure request that silently half-completed
-- and relied on somebody noticing.
DO $$
DECLARE
  constraint_row record;
  column_attnum smallint;
BEGIN
  IF to_regclass('public.residency_profiles') IS NULL THEN RETURN; END IF;

  SELECT attnum INTO column_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.residency_profiles'::regclass
    AND attname = 'user_id' AND NOT attisdropped;
  IF column_attnum IS NULL THEN RETURN; END IF;

  EXECUTE 'ALTER TABLE public.residency_profiles ALTER COLUMN user_id DROP NOT NULL';

  FOR constraint_row IN
    SELECT conname, confdeltype FROM pg_constraint
    WHERE conrelid = 'public.residency_profiles'::regclass
      AND contype = 'f' AND conkey = ARRAY[column_attnum]::smallint[]
  LOOP
    IF constraint_row.confdeltype <> 'n' THEN
      EXECUTE format('ALTER TABLE public.residency_profiles DROP CONSTRAINT %I', constraint_row.conname);
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.residency_profiles'::regclass
      AND conname = 'residency_profiles_user_set_null_fkey'
  ) THEN
    ALTER TABLE public.residency_profiles
      ADD CONSTRAINT residency_profiles_user_set_null_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- The agency dispute tables carry the person's user id on plain uuid columns
-- with no foreign key, so nothing removed them and the "anonymised" booking
-- stayed linkable to the individual through the case. The route now nulls
-- them; these indexes make that a lookup rather than a scan.
CREATE INDEX IF NOT EXISTS agency_cases_opened_by_idx ON public.agency_cases(opened_by_user_id) WHERE opened_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agency_case_messages_sender_idx ON public.agency_case_messages(sender_user_id) WHERE sender_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contact_queries_email_idx ON public.contact_queries(email);

NOTIFY pgrst, 'reload schema';
