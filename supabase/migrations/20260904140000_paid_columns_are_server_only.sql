-- 20260904140000: A browser session stops being able to grant itself anything
-- it was supposed to pay for, or any badge it was supposed to earn.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- Row-level security on candidate_profiles, employer_profiles and
-- job_listings says "you may update your own row". It says nothing about
-- WHICH COLUMNS, and the publishable key is in the client bundle by design.
-- So any signed-in account could write its own record directly - the same way
-- the profile screens legitimately do - and set:
--
--   candidate_profiles.interview_ready_credits  unlimited Interview Ready
--   candidate_profiles.membership_tier          Talent Pro without paying
--   candidate_profiles.is_featured              free homepage placement
--   candidate_profiles.whc_verified             the verification badge itself
--   candidate_profiles.review_score/_count      invented reviews
--   candidate_profiles.agency_*                 free Agency Register listing
--   employer_profiles.membership_tier           Employer Group, £999 a year
--   employer_profiles.talent_search_until       Discover Talent, permanently
--   employer_profiles.approval_status           self-approval past vetting
--   employer_profiles.annual_jobs_used          reset the Group job allowance
--   job_listings.is_live / expires_at           free adverts, indefinitely
--
-- The client-side checks that appear to prevent this - the alert about a
-- lapsed paid term, the approval gate on the live toggle - are JavaScript in
-- a page anybody can step around.
--
-- WHAT THIS DOES
--
-- Every one of these columns is written by a server route holding the service
-- role: Stripe fulfilment, the admin approval screens, the verification flow.
-- None is written by a browser. So the rule is simply that a browser session
-- may not change them, enforced in the database rather than in a page.
--
-- Raised rather than silently reverted, because a save that reports success
-- and does nothing is worse to debug than one that fails loudly. In normal
-- use it never fires: no screen sends these columns.
--
-- job_listings is the exception, because the edit form does legitimately send
-- is_live and status. There the rule is directional - a property may always
-- take its own role DOWN, and only a paid fulfilment may put one UP.
--
-- WHAT KEEPS WORKING
--
--   - Every server route (service role is not a browser session).
--   - Migrations and the SQL editor (no request JWT at all).
--   - Administrators, who are allowed through explicitly.
--   - Employers editing their own listings, photos, logo, contact and billing
--     details, and closing their own roles.

CREATE SCHEMA IF NOT EXISTS private;

-- True only for a request arriving with an end-user token. A service-role
-- call carries role 'service_role'; a migration or the SQL editor carries no
-- request JWT at all, so current_setting returns empty and this is false.
CREATE OR REPLACE FUNCTION private.is_end_user_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IN ('authenticated', 'anon');
$$;

REVOKE ALL ON FUNCTION private.is_end_user_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_end_user_session() TO authenticated, service_role;

-- Administrators act through server routes, but allowing them here costs
-- nothing and avoids a surprise if an admin screen is ever wired directly.
CREATE OR REPLACE FUNCTION private.write_is_privileged()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_end_user_session() THEN
    RETURN true;
  END IF;
  IF to_regprocedure('private.is_admin()') IS NOT NULL THEN
    RETURN COALESCE(private.is_admin(), false);
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION private.write_is_privileged() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.write_is_privileged() TO authenticated, service_role;

-- Compares only the columns the table actually has, so this migration does
-- not have to be kept in lockstep with every future column rename.
CREATE OR REPLACE FUNCTION private.guard_paid_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  guarded text;
  before_value text;
  after_value text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  IF private.write_is_privileged() THEN
    RETURN NEW;
  END IF;

  FOREACH guarded IN ARRAY TG_ARGV LOOP
    IF NOT (old_row ? guarded) THEN
      CONTINUE;
    END IF;
    before_value := old_row ->> guarded;
    after_value := new_row ->> guarded;
    IF before_value IS DISTINCT FROM after_value THEN
      RAISE EXCEPTION
        'Column "%" on % is set by Talent House when a payment or an approval completes, and cannot be changed from an account session.',
        guarded, TG_TABLE_NAME
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_paid_columns() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.candidate_profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS guard_paid_columns ON public.candidate_profiles;
    CREATE TRIGGER guard_paid_columns
      BEFORE UPDATE ON public.candidate_profiles
      FOR EACH ROW EXECUTE FUNCTION private.guard_paid_columns(
        'membership_tier', 'membership_started_at', 'membership_renews_at',
        'membership_stripe_subscription_id', 'membership_stripe_customer_id',
        'membership_cancel_at_period_end', 'stripe_customer_id',
        'interview_ready_credits', 'free_feature_credits', 'academy_discount_pct',
        'is_featured', 'featured_until',
        'whc_verified', 'verification_status', 'approval_status', 'right_to_work_status',
        'agency_available', 'agency_tier', 'agency_listed_until',
        'residency_member', 'review_score', 'review_count'
      );
  END IF;

  IF to_regclass('public.employer_profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS guard_paid_columns ON public.employer_profiles;
    CREATE TRIGGER guard_paid_columns
      BEFORE UPDATE ON public.employer_profiles
      FOR EACH ROW EXECUTE FUNCTION private.guard_paid_columns(
        'membership_tier', 'subscription_tier', 'membership_started_at',
        'membership_renews_at', 'membership_stripe_subscription_id',
        'membership_stripe_customer_id', 'membership_cancel_at_period_end',
        'stripe_customer_id', 'talent_search_until',
        'featured_employer', 'is_featured', 'featured_until',
        'approval_status', 'verification_status',
        'annual_job_allowance', 'annual_jobs_used', 'residency_member'
      );
  END IF;
END $$;

-- job_listings is directional rather than frozen: the edit form legitimately
-- sends is_live and status, and a property must always be able to take its
-- own role down. Only a paid fulfilment may put one up or move its term.
CREATE OR REPLACE FUNCTION private.guard_paid_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.write_is_privileged() THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.is_live, false) AND NOT COALESCE(OLD.is_live, false) THEN
    RAISE EXCEPTION
      'A role goes live when its advert is paid for. Use Repost to relist this one.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status = 'active' AND COALESCE(OLD.status, '') IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION
      'A role becomes active when its advert is paid for. Use Repost to relist this one.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- The paid term, the tier that was bought and the date it was bought on.
  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'The paid term of an advert is set at checkout.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'The advert tier is set at checkout.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_paid_listing() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.job_listings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS guard_paid_listing ON public.job_listings;
    CREATE TRIGGER guard_paid_listing
      BEFORE UPDATE ON public.job_listings
      FOR EACH ROW EXECUTE FUNCTION private.guard_paid_listing();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
