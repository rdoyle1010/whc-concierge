-- A property's contact details are its own.
--
-- 040 wrote one row policy for both browser roles:
--
--   CREATE POLICY employer_public_read ON public.employer_profiles
--   FOR SELECT TO anon, authenticated USING (approval_status = 'approved');
--
-- and left both roles holding SELECT on every column. 20260901090000 spotted
-- half of that and narrowed the columns for anon, so the publishable key can
-- only read what the public directory renders. It did not narrow authenticated.
--
-- The consequence: any signed-in account - a candidate, a rival property, a
-- person who registered thirty seconds ago - could read every approved
-- property's email, phone, contact name, general manager, spa director,
-- street address, postcode, exact coordinates, purchase order reference and
-- Stripe customer id, straight from the browser with the publishable key. No
-- screen in the product shows any of it. It was reachable because the grant
-- was never narrowed, and a column privilege applies to the role no matter
-- which policy admitted the row.
--
-- This narrows it, and gives the property and the administrators a way back
-- to their own full record.

-- ---------------------------------------------------------------------------
-- 1. The columns nobody else's browser has any business reading.
-- ---------------------------------------------------------------------------
-- Written as a deny list applied to whatever columns the table actually has,
-- rather than an allow list of column names. An allow list has to be complete
-- or a page silently loses a field, and it goes stale the moment somebody adds
-- a column. This way a new column is granted by default - exactly as today, so
-- nothing regresses - and only these named columns are ever taken away.
DO $$
DECLARE
  granted text;
  private_columns text[] := ARRAY[
    -- How to reach the property. The public directory offers a contact form
    -- and the platform's own messaging; it has never printed these.
    'email', 'contact_email', 'work_email',
    'phone', 'contact_phone',
    'contact_name', 'gm_name', 'spa_director_name',
    -- Where it is, precisely. The street line and the exact coordinates are
    -- how somebody turns up uninvited, and nothing in the browser reads them.
    -- The postcode deliberately stays public: the mobile job screen prints it
    -- under the property name, and a hotel's postcode is on its own website.
    'address', 'latitude', 'longitude',
    -- Money and identity at the payment provider.
    'stripe_customer_id', 'membership_stripe_customer_id',
    'membership_stripe_subscription_id', 'purchase_order_ref',
    -- Commercial standing. A rival property reading what you pay for and how
    -- much of your allowance is left is a competitive leak, not a privacy one,
    -- but it is still nobody's business.
    'membership_tier', 'membership_started_at', 'membership_renews_at',
    'membership_cancel_at_period_end', 'membership_past_due',
    'annual_job_allowance', 'annual_jobs_used', 'launch_listing_credits',
    'talent_search_until',
    -- Talent House's own notes about them.
    'approval_notes', 'verification_notes',
    -- Contact preferences.
    'sms_opt_in'
  ];
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO granted
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'employer_profiles'
    AND NOT (column_name = ANY (private_columns));

  IF granted IS NULL THEN
    RAISE EXCEPTION 'employer_profiles has no readable columns left - refusing to lock the table';
  END IF;

  EXECUTE 'REVOKE SELECT ON TABLE public.employer_profiles FROM authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.employer_profiles TO authenticated', granted);
END $$;

-- ---------------------------------------------------------------------------
-- 2. The way back to your own record.
-- ---------------------------------------------------------------------------
-- A column privilege belongs to a role, not to a row, so there is no grant
-- that can say "all of your own row, and the public part of everyone else's".
-- This view is that sentence. It runs as its owner, which is what lets it
-- past the narrowed grant above, and the WHERE clause is the whole guard:
-- your own row, or every row if you are an administrator.
--
-- NOTE for whoever adds the next column: a view built on p.* fixes its column
-- list at creation, so a new column on employer_profiles will not appear here
-- until this view is recreated. If a new field goes missing from the employer
-- dashboard, that is why.
DROP VIEW IF EXISTS public.employer_profiles_private;
CREATE VIEW public.employer_profiles_private
WITH (security_invoker = false) AS
SELECT p.*
FROM public.employer_profiles p
WHERE p.user_id = (SELECT auth.uid())
   OR private.is_admin();

COMMENT ON VIEW public.employer_profiles_private IS
  'Your own property record in full, or every record if you are an administrator. Exists because employer_profiles column privileges are deliberately narrow for authenticated.';

REVOKE ALL ON public.employer_profiles_private FROM PUBLIC, anon;
GRANT SELECT ON public.employer_profiles_private TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
