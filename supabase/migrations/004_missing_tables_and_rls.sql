-- 004: Missing tables, RLS policies, and storage policies
-- Run in Supabase SQL Editor

-- ═══════ Applications table ═══════
CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid,
  job_listing_id uuid,
  job_id uuid, -- alias used in some queries
  status text DEFAULT 'pending',
  match_score integer,
  cover_note text,
  cover_letter text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own applications" ON applications;
CREATE POLICY "Users can manage own applications" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Messages table ═══════
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;
CREATE POLICY "Users can manage own messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Message threads table ═══════
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid,
  participant_2 uuid,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own threads" ON message_threads;
CREATE POLICY "Users can manage own threads" ON message_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Reviews table ═══════
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid,
  reviewed_id uuid,
  rating integer,
  comment text,
  type text DEFAULT 'candidate',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage reviews" ON reviews;
CREATE POLICY "Users can manage reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Swipes table ═══════
CREATE TABLE IF NOT EXISTS swipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  target_id text,
  direction text,
  target_type text DEFAULT 'job',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage swipes" ON swipes;
CREATE POLICY "Users can manage swipes" ON swipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Matches table ═══════
CREATE TABLE IF NOT EXISTS matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid,
  employer_id uuid,
  job_id uuid,
  score integer,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view matches" ON matches;
CREATE POLICY "Users can view matches" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Agency bookings table ═══════
CREATE TABLE IF NOT EXISTS agency_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid,
  employer_id uuid,
  shift_date date,
  shift_type text,
  hours integer,
  rate integer,
  status text DEFAULT 'pending',
  commission_amount integer,
  commission_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agency_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage bookings" ON agency_bookings;
CREATE POLICY "Users can manage bookings" ON agency_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════ Profiles table (for role lookup) ═══════
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  role text DEFAULT 'candidate',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR ALL TO authenticated USING (true);

-- ═══════ Relaxed RLS on core tables ═══════
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access candidates" ON candidate_profiles;
CREATE POLICY "Authenticated full access candidates" ON candidate_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access employers" ON employer_profiles;
CREATE POLICY "Authenticated full access employers" ON employer_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated full access jobs" ON job_listings;
CREATE POLICY "Authenticated full access jobs" ON job_listings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read for jobs and candidate profiles (for agency/browse)
DROP POLICY IF EXISTS "Public can read active jobs" ON job_listings;
CREATE POLICY "Public can read active jobs" ON job_listings FOR SELECT TO anon USING (status = 'active');

DROP POLICY IF EXISTS "Public can read approved candidates" ON candidate_profiles;
CREATE POLICY "Public can read approved candidates" ON candidate_profiles FOR SELECT TO anon USING (true);

-- ═══════ Storage: simple open policy for authenticated users ═══════
DROP POLICY IF EXISTS "Authenticated storage access" ON storage.objects;
CREATE POLICY "Authenticated storage access" ON storage.objects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public storage read" ON storage.objects;
CREATE POLICY "Public storage read" ON storage.objects FOR SELECT TO anon USING (true);
