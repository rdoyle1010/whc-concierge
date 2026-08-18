-- 040: Align repository migrations with the security and operational hardening
-- already verified on the live Spa Platform database.

CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Keep relocatable extensions out of the public Data API schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'btree_gist' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION btree_gist SET SCHEMA extensions;
  END IF;
END $$;

-- Remove a redundant index; the identically-keyed UNIQUE constraint remains.
DROP INDEX IF EXISTS public.saved_jobs_candidate_job_uq;

-- Move privileged RLS helpers out of the exposed public schema. ALTER FUNCTION
-- preserves dependent policy references and Postgres rewrites them to private.*.
DO $$
BEGIN
  IF to_regprocedure('public.approved_employer_can_view_candidate(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.approved_employer_can_view_candidate(uuid) SET SCHEMA private;
  END IF;
  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    ALTER FUNCTION public.is_admin() SET SCHEMA private;
  END IF;
  IF to_regprocedure('public.owns_candidate_profile(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.owns_candidate_profile(uuid) SET SCHEMA private;
  END IF;
  IF to_regprocedure('public.owns_employer_profile(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.owns_employer_profile(uuid) SET SCHEMA private;
  END IF;
  IF to_regprocedure('public.owns_job_listing(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.owns_job_listing(uuid) SET SCHEMA private;
  END IF;
END $$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

REVOKE ALL ON FUNCTION private.approved_employer_can_view_candidate(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_candidate_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_employer_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_job_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.approved_employer_can_view_candidate(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_candidate_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_employer_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_job_listing(uuid) TO authenticated, service_role;

-- The maintenance claim RPC is server-only. Service-role calls are made from
-- the Agency booking API; browser roles must never execute it directly.
DO $$
BEGIN
  IF to_regprocedure('public.claim_maintenance_job(text,integer)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.claim_maintenance_job(text, integer) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.claim_maintenance_job(text, integer) TO service_role;
  END IF;
END $$;

-- Split public reads from signed-in owner/admin reads so anonymous policies
-- never need privileged helper functions.
DROP POLICY IF EXISTS employer_read ON public.employer_profiles;
DROP POLICY IF EXISTS employer_public_read ON public.employer_profiles;
DROP POLICY IF EXISTS employer_owner_admin_read ON public.employer_profiles;
CREATE POLICY employer_public_read
ON public.employer_profiles FOR SELECT TO anon, authenticated
USING (approval_status = 'approved');
CREATE POLICY employer_owner_admin_read
ON public.employer_profiles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR private.is_admin());

DROP POLICY IF EXISTS job_public_read ON public.job_listings;
DROP POLICY IF EXISTS job_owner_admin_read ON public.job_listings;
CREATE POLICY job_public_read
ON public.job_listings FOR SELECT TO anon, authenticated
USING (is_live = true);
CREATE POLICY job_owner_admin_read
ON public.job_listings FOR SELECT TO authenticated
USING (private.owns_job_listing(id) OR private.is_admin());

-- Admin-only reads should not be policies for PUBLIC.
DROP POLICY IF EXISTS "Admins can view queries" ON public.contact_queries;
CREATE POLICY "Admins can view queries"
ON public.contact_queries FOR SELECT TO authenticated
USING (private.is_admin());

DROP POLICY IF EXISTS "Admins can read all property_profiles" ON public.property_profiles;
CREATE POLICY "Admins can read all property_profiles"
ON public.property_profiles FOR SELECT TO authenticated
USING (private.is_admin());
DROP POLICY IF EXISTS "Admins can update any property_profile" ON public.property_profiles;
CREATE POLICY "Admins can update any property_profile"
ON public.property_profiles FOR UPDATE TO authenticated
USING (private.is_admin()) WITH CHECK (private.is_admin());

-- Timed Agency availability and the legacy agency_requests table are served
-- only through authenticated server routes using the service role.
DROP POLICY IF EXISTS pub_read_available_days ON public.agency_availability;
REVOKE ALL ON TABLE public.agency_availability FROM anon, authenticated;
REVOKE ALL ON TABLE public.agency_availability_windows FROM anon, authenticated;
DROP POLICY IF EXISTS "Agency requests visible to all logged in" ON public.agency_requests;
DROP POLICY IF EXISTS "Employers manage own requests" ON public.agency_requests;
REVOKE ALL ON TABLE public.agency_requests FROM anon, authenticated;

-- Messages are intentionally realtime; add the table only if it is not
-- already present in the publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Never allow a therapist payout before the paid shift has ended. A valid
-- payout is also the operational completion point for the booking.
CREATE OR REPLACE FUNCTION public.guard_agency_payout_after_shift()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  shift_ends_at timestamptz;
BEGIN
  IF NEW.payout_status = 'paid' AND COALESCE(OLD.payout_status, '') <> 'paid' THEN
    IF NEW.paid_at IS NULL THEN
      RAISE EXCEPTION 'Agency payout cannot be marked paid before the property payment is recorded';
    END IF;
    IF NEW.status NOT IN ('confirmed', 'completed') THEN
      RAISE EXCEPTION 'Agency payout is only allowed for confirmed bookings';
    END IF;
    IF NEW.shift_date IS NULL THEN
      RAISE EXCEPTION 'Agency payout requires a shift date';
    END IF;

    shift_ends_at := (NEW.shift_date + COALESCE(NEW.shift_end_time, TIME '23:59:59')) AT TIME ZONE 'Europe/London';
    IF now() < shift_ends_at THEN
      RAISE EXCEPTION 'Agency payout cannot be marked paid before the shift has ended';
    END IF;

    NEW.payout_at := COALESCE(NEW.payout_at, now());
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_agency_payout_after_shift ON public.agency_bookings;
CREATE TRIGGER trg_guard_agency_payout_after_shift
BEFORE UPDATE OF payout_status ON public.agency_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_agency_payout_after_shift();

-- Remove old duplicate/permissive policies that accumulated across historic
-- migrations. Keep only the explicit least-privilege versions.
DROP POLICY IF EXISTS "Service role full access blog" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
DROP POLICY IF EXISTS pub_read_published ON public.blog_posts;
DROP POLICY IF EXISTS anyone_can_enquire ON public.contact_queries;
DROP POLICY IF EXISTS "Public read hotel_brands" ON public.hotel_brands;
DROP POLICY IF EXISTS "Public read product_houses" ON public.product_houses;
DROP POLICY IF EXISTS "Public read systems" ON public.systems;

DROP POLICY IF EXISTS "Candidates manage own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS own_saved_jobs ON public.saved_jobs;
CREATE POLICY "Candidates manage own saved jobs"
ON public.saved_jobs FOR ALL TO authenticated
USING (
  candidate_id IN (
    SELECT cp.id FROM public.candidate_profiles cp
    WHERE cp.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  candidate_id IN (
    SELECT cp.id FROM public.candidate_profiles cp
    WHERE cp.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS pub_read_site_images ON public.site_images;
DROP POLICY IF EXISTS site_images_public_read ON public.site_images;
CREATE POLICY site_images_public_read
ON public.site_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS site_images_admin_insert ON public.site_images;
DROP POLICY IF EXISTS site_images_admin_update ON public.site_images;
DROP POLICY IF EXISTS site_images_admin_delete ON public.site_images;
CREATE POLICY site_images_admin_insert
ON public.site_images FOR INSERT TO authenticated
WITH CHECK (private.is_admin());
CREATE POLICY site_images_admin_update
ON public.site_images FOR UPDATE TO authenticated
USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY site_images_admin_delete
ON public.site_images FOR DELETE TO authenticated
USING (private.is_admin());
