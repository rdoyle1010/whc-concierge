-- Which campaign brought somebody in.
--
-- The opening offer is granted to everybody inside the window, so the code is
-- not a gate. It is a number: every campaign that carries it can be counted
-- afterwards, which is the only way to learn which one was worth running.
--
-- Normalised before it is written, so SPA-WELL26, spa well 26 and spawell26
-- are one value rather than three.
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS signup_code text;

CREATE INDEX IF NOT EXISTS candidate_profiles_signup_code_idx
  ON candidate_profiles (signup_code)
  WHERE signup_code IS NOT NULL;
