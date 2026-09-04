-- 20260901170000: A professional's record stops being readable in full by
-- every approved employer's browser.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- Row-level security decides which ROWS an approved employer may read. It
-- says nothing about which COLUMNS. Migration 20260901090000 narrowed
-- `employer_profiles` for anonymous visitors, but nothing ever narrowed
-- `candidate_profiles` for signed-in ones - so any screen that queried the
-- table directly with the publishable key received whole candidate records.
--
-- The mobile Discover Talent screen did exactly that: `select('*')` on up to
-- a hundred approved candidates, to render a name and a headline. Sitting
-- unread in that response were phone numbers, postcodes, latitude and
-- longitude, work email addresses, CV and right-to-work document paths,
-- insurance documents, verification and approval notes, salary expectations
-- the professional had marked private, and Stripe customer and Connect
-- account identifiers. The employer analytics page did the same for every
-- applicant. Both are gone in this batch - the screen removed, the page moved
-- to a server route with a field allow-list.
--
-- This closes the door behind them. Column-level grants cannot express "your
-- own row in full, other people's narrowly", so the fix is at the row level
-- instead: with the publishable key, a professional reads their own record
-- and nobody else's. Employers reach candidates only through the server
-- routes, which use the service role and already apply a field allow-list,
-- Private Career Mode anonymisation, Stealth Mode, and the block list.
--
-- WHAT KEEPS WORKING
--
--   - A professional reading and editing their own profile (own-row policy,
--     unchanged since 031).
--   - Administrators (is_admin, unchanged).
--   - Every server route: /api/employer/candidates, /api/agency/directory,
--     /api/mobile/employer-matches, /api/search, /api/swipe and the rest all
--     use the service role, which row-level security does not apply to.
--   - The public homepage, property pages and Residency pages, which are all
--     rendered server-side with the service role.

DO $$
DECLARE
  policy_name text;
BEGIN
  IF to_regclass('public.candidate_profiles') IS NULL THEN
    RETURN;
  END IF;

  -- The employer-facing read policy, whatever it is called in this database.
  -- 031 created `candidate_read`; a rename or an inherited duplicate is
  -- dropped just as readily, because the point is that no policy grants a
  -- browser session another person's candidate row.
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'candidate_profiles'
      AND cmd IN ('SELECT', 'ALL')
      AND qual IS NOT NULL
      AND qual ILIKE '%approved_employer_can_view_candidate%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidate_profiles', policy_name);
  END LOOP;

  EXECUTE 'ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY';

  -- Re-assert the own-row read, so a professional can always see their own
  -- record even if the policy set above was the only SELECT policy present.
  EXECUTE 'DROP POLICY IF EXISTS candidate_read_own ON public.candidate_profiles';
  EXECUTE format(
    'CREATE POLICY candidate_read_own ON public.candidate_profiles
     FOR SELECT TO authenticated
     USING (user_id = (SELECT auth.uid()) OR %s)',
    CASE
      WHEN to_regprocedure('private.is_admin()') IS NOT NULL THEN 'private.is_admin()'
      ELSE 'public.is_admin()'
    END
  );
END $$;

-- Nothing anonymous has any business reading a professional's record. Every
-- public surface that shows one is server-rendered with the service role.
REVOKE ALL ON TABLE public.candidate_profiles FROM anon;

NOTIFY pgrst, 'reload schema';
