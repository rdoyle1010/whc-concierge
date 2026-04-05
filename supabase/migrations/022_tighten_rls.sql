-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
-- 022: Tighten RLS \u2014 replace blanket authenticated=full-access
-- with owner-based policies on all user-facing tables.
-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

-- candidate_profiles
DROP POLICY IF EXISTS "Authenticated users full access to candidate_profiles" ON candidate_profiles;
CREATE POLICY "Users can view all candidate profiles"
  ON candidate_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own candidate profile"
  ON candidate_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can insert own candidate profile"
  ON candidate_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own candidate profile"
  ON candidate_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

-- employer_profiles
DROP POLICY IF EXISTS "Authenticated users full access to employer_profiles" ON employer_profiles;
CREATE POLICY "Users can view all employer profiles"
  ON employer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own employer profile"
  ON employer_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can insert own employer profile"
  ON employer_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own employer profile"
  ON employer_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());
-- job_listings
DROP POLICY IF EXISTS "Authenticated users full access to job_listings" ON job_listings;
CREATE POLICY "Anyone can view live job listings"
  ON job_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employers can insert own job listings"
  ON job_listings FOR INSERT TO authenticated
  WITH CHECK (
    employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Employers can update own job listings"
  ON job_listings FOR UPDATE TO authenticated
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can delete own job listings"
  ON job_listings FOR DELETE TO authenticated
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

-- applications
DROP POLICY IF EXISTS "Authenticated users full access to applications" ON applications;
CREATE POLICY "Candidates can view own applications"
  ON applications FOR SELECT TO authenticated
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    OR job_id IN (SELECT id FROM job_listings WHERE employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Candidates can insert applications"
  ON applications FOR INSERT TO authenticated
  WITH CHECK (candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update applications on their jobs"
  ON applications FOR UPDATE TO authenticated
  USING (job_id IN (SELECT id FROM job_listings WHERE employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())));

-- messages
DROP POLICY IF EXISTS "Authenticated users full access to messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own received messages (mark read)"
  ON messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());
-- reviews
DROP POLICY IF EXISTS "Authenticated users full access to reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- swipes
DROP POLICY IF EXISTS "Authenticated users full access to swipes" ON swipes;
CREATE POLICY "Users can view own swipes"
  ON swipes FOR SELECT TO authenticated
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    OR employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own swipes"
  ON swipes FOR INSERT TO authenticated
  WITH CHECK (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    OR employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );

-- matches
DROP POLICY IF EXISTS "Authenticated users full access to matches" ON matches;
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT TO authenticated
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    OR job_id IN (SELECT id FROM job_listings WHERE employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()))
  );

-- agency_bookings
DROP POLICY IF EXISTS "Authenticated users full access to agency_bookings" ON agency_bookings;
CREATE POLICY "Users can view own agency bookings"
  ON agency_bookings FOR SELECT TO authenticated
  USING (
    candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
    OR employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Employers can insert agency bookings"
  ON agency_bookings FOR INSERT TO authenticated
  WITH CHECK (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Employers can update own agency bookings"
  ON agency_bookings FOR UPDATE TO authenticated
  USING (employer_id IN (SELECT id FROM employer_profiles WHERE user_id = auth.uid()));

-- Taxonomy lookup tables: read-only for all authenticated
-- Skills, systems, product_houses, certifications, hotel_brands
-- These are reference data \u2014 everyone can read, only admins write.
-- (Admin writes go through the admin client which bypasses RLS.)
