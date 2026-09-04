-- 20260901090000: Privacy enforcement.
-- Four confirmed data-exposure findings closed in the database itself, so a
-- direct anon-key query can no longer read what the application layer hides:
--   1. reviews were world-readable (031:234 had no TO clause).
--   2. Private Career Mode, Stealth Mode and profile_visible were enforced
--      only in the API, never in RLS.
--   3. anon held a whole-row SELECT on employer_profiles, publishing contact
--      and Stripe fields alongside the public property facts.
--   4. profile_blocks had no INSERT/DELETE policy and notifications no UPDATE
--      policy, so the mobile privacy controls failed - the unblock silently
--      matched zero rows and told the candidate it had worked.
--
-- Additive and idempotent: safe to run more than once, and safe to run before
-- or after 20260831190000_private_career_mode.sql (private_mode is read
-- through a dynamic to_jsonb lookup rather than a static column reference).
-- Style follows 031_security_rescue.sql and 040_security_alignment.sql:
-- SECURITY DEFINER helpers in the private schema, inherited policies dropped
-- by enumerating pg_policies, and anon revoked rather than trusted.

CREATE SCHEMA IF NOT EXISTS private;

-- ---------------------------------------------------------------------------
-- 1. Candidate visibility is enforced in RLS, not just in the API.
-- ---------------------------------------------------------------------------
-- The 031 helper checked only approval status and blocks, so a candidate who
-- had turned their profile off, gone into Stealth Mode or joined Private
-- Career Mode was still returned - with every column - to any approved
-- employer querying candidate_profiles directly with the publishable key.
--
-- The function is replaced in whichever schema it currently occupies
-- (040 moved it from public to private and Postgres rewrote the dependent
-- policy references), so candidate_read keeps working untouched.
--
-- private_mode arrives with 20260831190000_private_career_mode.sql. Reading it
-- through to_jsonb means this body compiles whether or not that column exists
-- yet, and starts enforcing it the moment the column is added.
DO $$
DECLARE
  target_schema text;
  body text;
BEGIN
  body := $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.employer_profiles e
    JOIN public.candidate_profiles c ON c.id = candidate_uuid
    WHERE e.user_id = auth.uid()
      AND e.approval_status = 'approved'
      AND c.approval_status = 'approved'
      AND c.profile_visible IS NOT FALSE
      AND c.stealth_mode IS NOT TRUE
      AND COALESCE((to_jsonb(c) ->> 'private_mode')::boolean, false) = false
      AND NOT EXISTS (
        SELECT 1 FROM public.profile_blocks b
        WHERE b.candidate_id = c.id AND b.blocked_employer_id = e.id
      )
  );
  $fn$;

  FOREACH target_schema IN ARRAY ARRAY['private', 'public'] LOOP
    IF to_regprocedure(target_schema || '.approved_employer_can_view_candidate(uuid)') IS NOT NULL THEN
      EXECUTE format(
        'CREATE OR REPLACE FUNCTION %I.approved_employer_can_view_candidate(candidate_uuid uuid)
         RETURNS boolean
         LANGUAGE sql
         STABLE
         SECURITY DEFINER
         SET search_path = public
         AS %L',
        target_schema, body
      );
    END IF;
  END LOOP;

  -- A database that has never run 031 gets the hardened helper in private.
  IF to_regprocedure('private.approved_employer_can_view_candidate(uuid)') IS NULL
     AND to_regprocedure('public.approved_employer_can_view_candidate(uuid)') IS NULL THEN
    EXECUTE format(
      'CREATE FUNCTION private.approved_employer_can_view_candidate(candidate_uuid uuid)
       RETURNS boolean
       LANGUAGE sql
       STABLE
       SECURITY DEFINER
       SET search_path = public
       AS %L', body
    );
  END IF;

  IF to_regprocedure('private.approved_employer_can_view_candidate(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION private.approved_employer_can_view_candidate(uuid) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION private.approved_employer_can_view_candidate(uuid) TO authenticated, service_role';
  END IF;
  IF to_regprocedure('public.approved_employer_can_view_candidate(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.approved_employer_can_view_candidate(uuid) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.approved_employer_can_view_candidate(uuid) TO authenticated, service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Reviews are readable by their two parties and admins only.
-- ---------------------------------------------------------------------------
-- Every public review surface (the property page, the property reviews API,
-- the mobile property and reputation APIs, the agency profile and the public
-- counts) reads reviews with the service role and publishes a curated shape,
-- so nothing public depends on this policy.
DO $$
DECLARE
  policy_name text;
  admin_fn text;
BEGIN
  IF to_regclass('public.reviews') IS NULL THEN
    RETURN;
  END IF;

  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reviews', policy_name);
  END LOOP;

  EXECUTE 'ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY';

  admin_fn := CASE
    WHEN to_regprocedure('private.is_admin()') IS NOT NULL THEN 'private.is_admin()'
    ELSE 'public.is_admin()'
  END;

  EXECUTE format(
    'CREATE POLICY review_read_parties ON public.reviews
     FOR SELECT TO authenticated
     USING (reviewer_id = (SELECT auth.uid()) OR reviewee_id = (SELECT auth.uid()) OR %s)',
    admin_fn
  );
END $$;

REVOKE SELECT ON TABLE public.reviews FROM anon;

-- ---------------------------------------------------------------------------
-- 3. anon reads only the employer columns the public pages actually render.
-- ---------------------------------------------------------------------------
-- 040:73-75 granted anon SELECT on every column of an approved employer,
-- which published contact_email, contact_phone, contact_name, gm_name,
-- spa_director_name, work_email, address, latitude/longitude,
-- stripe_customer_id and membership_stripe_customer_id to anybody holding the
-- publishable key. The row policy is unchanged; only the column privileges
-- narrow, so signed-in employers, the mobile app (authenticated) and every
-- service-role route are unaffected.
--
-- The granted set is exactly what the two anonymous readers select:
--   src/app/properties/page.tsx  - the public property directory, which reads
--     id, company_name, property_name, hotel_group, location, city,
--     about_text, logo_url, property_photos, review_score, review_count,
--     star_rating, property_type, tagline, featured_employer, featured_until,
--     created_at, is_verified and filters on approval_status.
--   src/app/api/public-stats/route.ts - counts approved properties, so it
--     needs id and approval_status.
-- approval_status is granted because anon must be able to filter on it; every
-- other column stays server-side behind the service role.
REVOKE SELECT ON TABLE public.employer_profiles FROM anon;
GRANT SELECT (
  id,
  company_name,
  property_name,
  hotel_group,
  location,
  city,
  about_text,
  logo_url,
  property_photos,
  review_score,
  review_count,
  star_rating,
  property_type,
  tagline,
  featured_employer,
  featured_until,
  created_at,
  is_verified,
  approval_status
) ON public.employer_profiles TO anon;

-- ---------------------------------------------------------------------------
-- 4. The mobile privacy controls can actually write.
-- ---------------------------------------------------------------------------
-- mobile/app/privacy-stealth.tsx blocks and unblocks employers, and
-- mobile/app/notifications.tsx marks notifications read or done, both with the
-- anon key on an authenticated session. profile_blocks had a read policy only,
-- so the INSERT was refused and the DELETE matched zero rows while the app
-- reported success - a privacy control that lied to the candidate.
DO $$
DECLARE
  owns_fn text;
BEGIN
  IF to_regclass('public.profile_blocks') IS NOT NULL THEN
    owns_fn := CASE
      WHEN to_regprocedure('private.owns_candidate_profile(uuid)') IS NOT NULL THEN 'private.owns_candidate_profile'
      ELSE 'public.owns_candidate_profile'
    END;

    EXECUTE 'ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS blocks_insert_candidate ON public.profile_blocks';
    EXECUTE format(
      'CREATE POLICY blocks_insert_candidate ON public.profile_blocks
       FOR INSERT TO authenticated WITH CHECK (%s(candidate_id))', owns_fn
    );
    EXECUTE 'DROP POLICY IF EXISTS blocks_delete_candidate ON public.profile_blocks';
    EXECUTE format(
      'CREATE POLICY blocks_delete_candidate ON public.profile_blocks
       FOR DELETE TO authenticated USING (%s(candidate_id))', owns_fn
    );
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS notifications_update_own ON public.notifications';
    EXECUTE
      'CREATE POLICY notifications_update_own ON public.notifications
       FOR UPDATE TO authenticated
       USING (user_id = (SELECT auth.uid()))
       WITH CHECK (user_id = (SELECT auth.uid()))';
  END IF;
END $$;

REVOKE ALL ON TABLE public.profile_blocks FROM anon;
REVOKE ALL ON TABLE public.notifications FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.profile_blocks TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;

NOTIFY pgrst, 'reload schema';
