-- 20260904200000: close the insert door on a paid advert.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- guard_paid_listing already refused to let a browser session take an advert
-- live, set its paid term or change the tier that was bought. It was declared
-- BEFORE UPDATE, which covered every way an existing advert could be promoted
-- and none of the ways a new one could simply arrive that way:
--
--   CREATE TRIGGER guard_paid_listing BEFORE UPDATE ON public.job_listings
--
-- An insert never touched it. And /hotel/jobs/new - the original posting
-- wizard, unlinked for months but still answering on its URL - inserted
-- straight from the browser with is_live: true and no checkout anywhere in
-- the path. Any signed-in employer who reached that address published a live
-- advert for nothing, as often as they liked. /hotel/jobs did the same from
-- its own form. Both are now redirects to the paid flow, which fixes it for
-- anybody using the site; this fixes it for anybody using the API.
--
-- THE RULE
--
-- An advert is created as a draft. It goes live when something privileged -
-- the service role, running after Stripe has confirmed the payment - says so.
-- There is no path from a member's own session to a live advert, and there is
-- now no version of the platform where writing one directly is a way round
-- the checkout.
--
-- The update half below is unchanged from 20260904140000. It is repeated
-- rather than referenced because CREATE OR REPLACE takes the whole body, and
-- a function that exists in two halves in two files is a function nobody can
-- read.

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

  -- OLD is unassigned on an insert, so the two cases cannot share a body.
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_live, false) THEN
      RAISE EXCEPTION
        'A role goes live when its advert is paid for. Save it as a draft and publish it from Post a Role.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NEW.status = 'active' THEN
      RAISE EXCEPTION
        'A role becomes active when its advert is paid for. Save it as a draft and publish it from Post a Role.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NEW.expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'The paid term of an advert is set at checkout.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

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
      BEFORE INSERT OR UPDATE ON public.job_listings
      FOR EACH ROW EXECUTE FUNCTION private.guard_paid_listing();
  END IF;
END $$;

-- Adverts that went live through the door this closes. Nothing is taken down
-- automatically: a role somebody is genuinely recruiting for should not
-- vanish because of a defect that was not theirs. They are listed so a human
-- can decide, and the query is written to return nothing on a clean database.
DO $$
DECLARE
  v_unpaid integer;
BEGIN
  IF to_regclass('public.job_listings') IS NULL
     OR to_regclass('public.stripe_events') IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_unpaid
  FROM public.job_listings j
  WHERE COALESCE(j.is_live, false)
    AND j.expires_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.stripe_events e
      WHERE e.payload::text LIKE '%' || j.id::text || '%'
    );

  IF v_unpaid > 0 THEN
    RAISE NOTICE 'Live adverts with no paid term and no matching Stripe event: %. Review them on /admin/jobs.', v_unpaid;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
