-- Fix foreign key constraints to use ON DELETE CASCADE
-- This ensures profile records are cleaned up when auth users are deleted
-- and that the constraint references auth.users(id) correctly

-- candidate_profiles
ALTER TABLE candidate_profiles DROP CONSTRAINT IF EXISTS candidate_profiles_user_id_fkey;
ALTER TABLE candidate_profiles ADD CONSTRAINT candidate_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- employer_profiles
ALTER TABLE employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_user_id_fkey;
ALTER TABLE employer_profiles ADD CONSTRAINT employer_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
