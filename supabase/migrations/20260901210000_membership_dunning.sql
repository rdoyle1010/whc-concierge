-- 20260901210000: A failing card suspends what it pays for.
--
-- Additive and idempotent. Safe to run more than once. Every existing account
-- is not past due, which is the state they are all in today.
--
-- WHY
--
-- invoice.payment_failed handled two things: sponsored adverts, and Featured
-- placements after the second attempt. It did nothing about memberships.
--
-- So a card that starts failing left the member holding every benefit -
-- Interview Ready credits, the Academy discount, agency register visibility
-- and bookability, the Agency Plus fee reduction - until Stripe's dunning
-- finally gave up and cancelled the subscription, typically two to three
-- weeks later. All of it unpaid for, and some of it costing WHC real money
-- per use.
--
-- past_due is deliberately a flag rather than a tier change. The member keeps
-- their profile, their history and their place; only the benefits that cost
-- money stop, and invoice.paid clears the flag the moment the card goes
-- through.

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS membership_past_due boolean NOT NULL DEFAULT false;

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS membership_past_due boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS candidate_profiles_past_due_idx
  ON public.candidate_profiles(membership_past_due) WHERE membership_past_due;
CREATE INDEX IF NOT EXISTS employer_profiles_past_due_idx
  ON public.employer_profiles(membership_past_due) WHERE membership_past_due;

COMMENT ON COLUMN public.candidate_profiles.membership_past_due IS
  'Stripe has failed to collect this membership at least twice. Paid benefits are suspended; the account, tier and history are untouched. Cleared by the next paid invoice.';
COMMENT ON COLUMN public.employer_profiles.membership_past_due IS
  'Stripe has failed to collect this membership at least twice. Paid benefits are suspended; the account, tier and history are untouched. Cleared by the next paid invoice.';

-- The professional's own record of a purchase should not be silently revoked
-- by the cancellation of something else, so Featured is left to expire on its
-- own date. This index makes the sweep that clears expired ones cheap.
CREATE INDEX IF NOT EXISTS candidate_profiles_featured_until_idx
  ON public.candidate_profiles(featured_until) WHERE is_featured;

NOTIFY pgrst, 'reload schema';
