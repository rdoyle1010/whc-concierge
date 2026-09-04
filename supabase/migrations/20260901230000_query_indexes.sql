-- Indexes for the lookups this platform actually performs.
--
-- Postgres was doing a sequential scan for the commonest reads on the site:
-- finding a profile by its user_id, listing an employer's roles, opening an
-- application inbox, drawing a notification bell. At today's row counts that
-- is invisible. It stops being invisible somewhere around the first few
-- thousand professionals, and the failure mode is not an error - it is a
-- platform that gets slower every week until somebody notices.
--
-- All CREATE INDEX IF NOT EXISTS, so this is safe to run whatever already
-- exists live. Composite indexes are ordered equality-first, then the sort
-- column, so a single index serves both the filter and the ORDER BY.

-- Profile lookup by auth user. Every signed-in page load does this, twice.
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id
  ON candidate_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id
  ON employer_profiles (user_id);

-- The public job board: live and active, newest first.
CREATE INDEX IF NOT EXISTS idx_job_listings_live_posted
  ON job_listings (is_live, status, posted_date DESC);
-- An employer's own roles.
CREATE INDEX IF NOT EXISTS idx_job_listings_employer
  ON job_listings (employer_id, posted_date DESC);

-- Applications, read from both sides: the professional's history and the
-- employer's inbox, both filtered by status.
CREATE INDEX IF NOT EXISTS idx_applications_candidate
  ON applications (candidate_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_role
  ON applications (role_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_job
  ON applications (job_id, status);

-- Agency bookings: the professional's diary, the employer's bookings, and the
-- admin payout queue, which sorts by shift date.
CREATE INDEX IF NOT EXISTS idx_agency_bookings_candidate
  ON agency_bookings (candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_bookings_employer
  ON agency_bookings (employer_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_bookings_shift_date
  ON agency_bookings (shift_date);

-- Messages. A thread is read in order; an inbox is read by recipient.
CREATE INDEX IF NOT EXISTS idx_messages_recipient
  ON messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON messages (thread_id, created_at);

-- The notification bell, now that it appears in the signed-in shell on every
-- page rather than only on the public header.
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC);

-- Matches, from either side of the swipe.
CREATE INDEX IF NOT EXISTS idx_matches_candidate
  ON matches (candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_employer
  ON matches (employer_id, status);

-- Swipes: the deck excludes everything this person has already seen, so this
-- lookup happens once per card.
CREATE INDEX IF NOT EXISTS idx_swipes_swiper
  ON swipes (swiper_id, swiped_at DESC);

-- Reviews are read by the person reviewed, to compute their rating.
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee
  ON reviews (reviewee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_booking
  ON reviews (booking_id);

-- Stealth mode and blocking: checked on every discovery query, for every
-- candidate returned.
CREATE INDEX IF NOT EXISTS idx_profile_blocks_candidate
  ON profile_blocks (candidate_id);
CREATE INDEX IF NOT EXISTS idx_profile_blocks_employer
  ON profile_blocks (blocked_employer_id);

-- Residency conversations, both sides.
CREATE INDEX IF NOT EXISTS idx_residency_conversations_employer
  ON residency_conversations (employer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_residency_conversations_candidate
  ON residency_conversations (candidate_id, updated_at DESC);

-- Saved roles.
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate
  ON saved_jobs (candidate_id, created_at DESC);

ANALYZE;
