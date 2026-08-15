-- 031: Security rescue.
-- Replaces the early permissive policies instead of relying on their names,
-- protects account roles, limits candidate access, and makes CV/message
-- storage private. Apply in staging first and run the two-role smoke test.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_candidate_profile(candidate_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_profiles
    WHERE id = candidate_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_employer_profile(employer_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employer_profiles
    WHERE id = employer_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_job_listing(job_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_listings j
    JOIN public.employer_profiles e ON e.id = j.employer_id
    WHERE j.id = job_uuid AND e.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.approved_employer_can_view_candidate(candidate_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employer_profiles e
    JOIN public.candidate_profiles c ON c.id = candidate_uuid
    WHERE e.user_id = auth.uid()
      AND e.approval_status = 'approved'
      AND c.approval_status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM public.profile_blocks b
        WHERE b.candidate_id = c.id AND b.blocked_employer_id = e.id
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_candidate_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_employer_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_job_listing(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approved_employer_can_view_candidate(uuid) TO authenticated;

-- Prevent a browser client from promoting its own profiles.role to admin.
CREATE OR REPLACE FUNCTION public.protect_profile_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
      RAISE EXCEPTION 'admin roles can only be assigned by the service';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.role IS DISTINCT FROM OLD.role OR NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'account identity fields cannot be changed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_identity_trigger ON public.profiles;
CREATE TRIGGER protect_profile_identity_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_identity();

-- Normalise the two historic application/message column generations before
-- policies reference them.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS role_id uuid;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS job_id uuid;
UPDATE public.applications SET role_id = COALESCE(role_id, job_id), job_id = COALESCE(job_id, role_id)
WHERE role_id IS NULL OR job_id IS NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS recipient_id uuid;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'receiver_id'
  ) THEN
    EXECUTE 'UPDATE public.messages SET recipient_id = COALESCE(recipient_id, receiver_id) WHERE recipient_id IS NULL';
  END IF;
END $$;

-- Remove every inherited policy on the core tables. This catches the old
-- policies even where later migrations used a different policy name.
DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles','candidate_profiles','employer_profiles','job_listings',
    'applications','messages','message_threads','reviews','swipes','matches',
    'agency_bookings','candidate_skills','candidate_systems',
    'candidate_product_houses','candidate_certifications',
    'candidate_hotel_brands','candidate_previous_roles','job_required_skills',
    'job_preferred_skills','job_required_systems','job_required_product_houses',
    'job_required_certifications','job_required_hotel_brands','match_scores',
    'admin_audit_log','shortlisted_candidates','profile_blocks','notifications'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      FOR policy_name IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- Shared role record: own row only. Admin work uses checked server routes.
CREATE POLICY own_profile_read ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY own_profile_insert ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND role IN ('candidate','talent','employer'));
CREATE POLICY own_profile_update ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Candidate profiles are never anonymous. The public agency directory now
-- uses a service route with a strict field allow-list.
CREATE POLICY candidate_read ON public.candidate_profiles
FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.is_admin() OR public.approved_employer_can_view_candidate(id)
);
CREATE POLICY candidate_insert_own ON public.candidate_profiles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY candidate_update_own ON public.candidate_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY candidate_delete_own ON public.candidate_profiles
FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Approved properties remain visible on public job/property pages. Writes are
-- strictly owned. A later view migration can narrow the public columns too.
CREATE POLICY employer_read ON public.employer_profiles
FOR SELECT TO anon, authenticated USING (
  approval_status = 'approved' OR user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY employer_insert_own ON public.employer_profiles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY employer_update_own ON public.employer_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY employer_delete_own ON public.employer_profiles
FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY job_public_read ON public.job_listings
FOR SELECT TO anon, authenticated USING (
  is_live = true OR public.owns_job_listing(id) OR public.is_admin()
);
CREATE POLICY job_insert_own ON public.job_listings
FOR INSERT TO authenticated WITH CHECK (public.owns_employer_profile(employer_id));
CREATE POLICY job_update_own ON public.job_listings
FOR UPDATE TO authenticated
USING (public.owns_employer_profile(employer_id) OR public.is_admin())
WITH CHECK (public.owns_employer_profile(employer_id) OR public.is_admin());
CREATE POLICY job_delete_own ON public.job_listings
FOR DELETE TO authenticated USING (public.owns_employer_profile(employer_id) OR public.is_admin());

CREATE POLICY application_read_parties ON public.applications
FOR SELECT TO authenticated USING (
  public.owns_candidate_profile(candidate_id)
  OR public.owns_job_listing(COALESCE(role_id, job_id))
  OR public.is_admin()
);
CREATE POLICY application_insert_candidate ON public.applications
FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_profile(candidate_id));
CREATE POLICY application_update_employer ON public.applications
FOR UPDATE TO authenticated
USING (public.owns_job_listing(COALESCE(role_id, job_id)) OR public.is_admin())
WITH CHECK (public.owns_job_listing(COALESCE(role_id, job_id)) OR public.is_admin());

CREATE POLICY message_read_parties ON public.messages
FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());
CREATE POLICY message_insert_sender ON public.messages
FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY message_update_recipient ON public.messages
FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR public.is_admin());
CREATE POLICY message_delete_sender ON public.messages
FOR DELETE TO authenticated USING (sender_id = auth.uid() OR public.is_admin());

CREATE POLICY review_public_read ON public.reviews FOR SELECT USING (true);

CREATE POLICY swipe_read_own ON public.swipes
FOR SELECT TO authenticated USING (swiper_id = auth.uid() OR public.is_admin());

CREATE POLICY match_read_parties ON public.matches
FOR SELECT TO authenticated USING (
  public.owns_candidate_profile(candidate_id)
  OR public.owns_employer_profile(employer_id)
  OR public.is_admin()
);

CREATE POLICY booking_read_parties ON public.agency_bookings
FOR SELECT TO authenticated USING (
  public.owns_candidate_profile(candidate_id)
  OR public.owns_employer_profile(employer_id)
  OR public.is_admin()
);

-- Taxonomy answers may be read by signed-in users for matching, but only the
-- candidate who owns the profile can alter them.
DO $$
DECLARE
  table_name text;
  policy_prefix text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'candidate_skills','candidate_systems','candidate_product_houses',
    'candidate_certifications','candidate_hotel_brands','candidate_previous_roles'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      policy_prefix := replace(table_name, '_', '');
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', policy_prefix || '_read', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.owns_candidate_profile(candidate_id))', policy_prefix || '_insert', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.owns_candidate_profile(candidate_id)) WITH CHECK (public.owns_candidate_profile(candidate_id))', policy_prefix || '_update', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.owns_candidate_profile(candidate_id))', policy_prefix || '_delete', table_name);
    END IF;
  END LOOP;
END $$;

-- Job requirement joins are public-readable, but only their job owner writes.
DO $$
DECLARE
  table_name text;
  policy_prefix text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'job_required_skills','job_preferred_skills','job_required_systems',
    'job_required_product_houses','job_required_certifications','job_required_hotel_brands'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      policy_prefix := replace(table_name, '_', '');
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', policy_prefix || '_read', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.owns_job_listing(job_id))', policy_prefix || '_insert', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.owns_job_listing(job_id)) WITH CHECK (public.owns_job_listing(job_id))', policy_prefix || '_update', table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.owns_job_listing(job_id))', policy_prefix || '_delete', table_name);
    END IF;
  END LOOP;
END $$;

-- These tables are written only through authenticated service routes. Give
-- users the minimum reads required by dashboards.
CREATE POLICY shortlist_read_owner ON public.shortlisted_candidates
FOR SELECT TO authenticated USING (public.owns_employer_profile(employer_id) OR public.is_admin());
CREATE POLICY blocks_read_candidate ON public.profile_blocks
FOR SELECT TO authenticated USING (public.owns_candidate_profile(candidate_id) OR public.is_admin());
CREATE POLICY notifications_read_own ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Sensitive files are private and served through /api/files with a short-lived
-- signed URL. Public brand/property imagery remains public.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('talent-documents', 'talent-documents', false),
  ('message-attachments', 'message-attachments', false),
  ('site-images', 'site-images', true),
  ('profile-photos', 'profile-photos', true),
  ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

UPDATE public.candidate_profiles
SET cv_url = '/api/files?bucket=talent-documents&path=' || split_part(cv_url, '/talent-documents/', 2)
WHERE cv_url LIKE '%/talent-documents/%';

UPDATE public.candidate_profiles
SET insurance_document_url = '/api/files?bucket=talent-documents&path=' || split_part(insurance_document_url, '/talent-documents/', 2)
WHERE insurance_document_url LIKE '%/talent-documents/%';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'attachment_url'
  ) THEN
    EXECUTE $sql$
      UPDATE public.messages
      SET attachment_url = '/api/files?bucket=message-attachments&path=' || split_part(attachment_url, '/message-attachments/', 2)
      WHERE attachment_url LIKE '%/message-attachments/%'
    $sql$;
  END IF;
END $$;

UPDATE storage.buckets SET public = false
WHERE id IN ('talent-documents', 'message-attachments');
UPDATE storage.buckets SET public = true
WHERE id IN ('site-images', 'profile-photos', 'property-photos');

DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
  END LOOP;
END $$;

CREATE POLICY public_media_read ON storage.objects
FOR SELECT USING (bucket_id IN ('site-images','profile-photos','property-photos'));

-- The application upload API uses the service role after checking the caller,
-- path, file type and size. No general browser write policy is required.
