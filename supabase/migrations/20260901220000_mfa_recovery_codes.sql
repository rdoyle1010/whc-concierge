-- 20260901220000: Recovery codes for two-step verification.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- Two-step verification is now enforced on every page and every API route.
-- That is right, and on its own it means a professional who loses or wipes
-- their phone is permanently locked out of their own account - applications,
-- Agency earnings, Residency bookings - with no self-service route, no
-- recovery codes, no admin unlock, and not even a support link on the
-- challenge screen. Closing a security hole by creating a way to destroy
-- somebody's livelihood is not a trade worth making.
--
-- Enrolment now issues ten single-use codes, shown once. Redeeming one
-- removes the authenticator so the person can get back in on their password,
-- and prompts them to enrol again.
--
-- Only hashes are stored, salted with the user id. WHC cannot read a recovery
-- code, cannot send one back to somebody who lost them, and a leak of this
-- table yields nothing usable. Service-role only; no browser ever reads it.

CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS mfa_recovery_codes_user_idx
  ON public.mfa_recovery_codes(user_id) WHERE used_at IS NULL;

-- One code, one use, even if two tabs submit it at the same moment.
CREATE UNIQUE INDEX IF NOT EXISTS mfa_recovery_codes_unique
  ON public.mfa_recovery_codes(user_id, code_hash);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mfa_recovery_codes FROM anon, authenticated;
GRANT ALL ON TABLE public.mfa_recovery_codes TO service_role;

COMMENT ON TABLE public.mfa_recovery_codes IS
  'Single-use two-step recovery codes, stored as salted SHA-256 hashes. Redeeming one removes the account authenticator. Never readable by a browser, and never recoverable in plain text by anyone including WHC.';

NOTIFY pgrst, 'reload schema';
