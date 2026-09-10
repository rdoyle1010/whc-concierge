-- 20260910110000: Where a professional works now, if she wants it seen.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- The employer's Discover Talent card shows a name, a headline and little
-- else, and for a profile without a headline it shows a name and nothing at
-- all. A spa director scanning six cards can currently learn less about a
-- twenty-year head therapist than she would from a business card.
--
-- Most of what is missing was already being fetched and thrown away. The one
-- thing genuinely absent is the question a hiring manager asks first: where is
-- this person now?
--
-- It is also the most sensitive thing on the profile. A therapist quietly
-- looking is risking her job by answering it, so the answer is off by default
-- and stays off until she turns it on. Private Career Mode overrides it
-- entirely: somebody who has asked to be anonymous is not identified by her
-- employer's name instead of her own.

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS current_employer text;

-- Default false, and it must stay false. A column like this defaulting to true
-- would out every professional on the platform the moment it shipped.
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS current_employer_visible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.candidate_profiles.current_employer IS
  'Where the professional works now. Never shown to an employer unless current_employer_visible is true, and never in Private Career Mode.';
COMMENT ON COLUMN public.candidate_profiles.current_employer_visible IS
  'The professional opting in to showing her current employer. Off by default, deliberately.';
