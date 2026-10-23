-- Ambassadors, and the offers that open the platform.
--
-- Two things that look alike and are not.
--
-- The opening-month offers are automatic and need no code: a property that
-- registers inside the window gets one free Standard listing, a professional
-- gets two free Academy courses. Nothing to remember, nothing to type, no
-- support ticket when somebody mistypes a code. The only state they need is
-- a credit counter on the employer, because a free listing is spent later.
--
-- An ambassador is a named person who represents one part of the industry and
-- carries a code for their own network. The code is the point: it is how we
-- find out whose word actually moves people, which is worth more than the
-- courses it gives away.

-- One free listing, held as a credit rather than a date, so it can be granted
-- by hand to a property that deserves one and consumed exactly once.
ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS launch_listing_credits integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Which part of the industry they speak for. One brand, one hotel, one
  -- consultancy, four therapists, four residency hosts: the shape of the
  -- launch, and small enough that each of them is a real relationship.
  area text NOT NULL CHECK (area IN ('brand', 'hotel', 'consultancy', 'therapist', 'residency')),
  name text NOT NULL,
  organisation text,
  email text,
  -- Optional link to an account on the platform, so an ambassador who is also
  -- a member can be recognised as one.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Their own side of the arrangement, in their own words, so nobody has to
  -- reconstruct what was agreed a year later.
  arrangement text,
  bio text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassadors_area_idx ON public.ambassadors(area) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.ambassador_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  -- What redeeming it actually does. Kept as a named reward rather than a
  -- price, because a code that says "two Academy courses" survives a price
  -- change and a code that says "PS10 off" does not.
  reward text NOT NULL CHECK (reward IN ('academy_courses', 'free_listing', 'academy_bundle')),
  -- For academy_courses: which ones. Empty means the opening-month pair.
  reward_slugs text[] NOT NULL DEFAULT '{}',
  reward_quantity integer NOT NULL DEFAULT 1,
  -- Who may use it, so a therapist code cannot be spent by a property.
  audience text NOT NULL DEFAULT 'talent' CHECK (audience IN ('talent', 'employer', 'any')),
  max_redemptions integer NOT NULL DEFAULT 50,
  redemptions_used integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_codes_ambassador_idx ON public.ambassador_codes(ambassador_id);

CREATE TABLE IF NOT EXISTS public.ambassador_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.ambassador_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- One code, one person, once. The whole point of a per-area allocation is
  -- that it runs out.
  UNIQUE (code_id, user_id)
);
CREATE INDEX IF NOT EXISTS ambassador_redemptions_user_idx ON public.ambassador_redemptions(user_id);

-- Claiming a code has to be one statement, or two people redeeming the last
-- place both read "one left" and both get it. This increments and checks in
-- the same update and returns whether the claim succeeded.
CREATE OR REPLACE FUNCTION public.claim_ambassador_code(p_code text, p_user_id uuid)
RETURNS TABLE (
  claimed boolean,
  reason text,
  code_id uuid,
  reward text,
  reward_slugs text[],
  reward_quantity integer,
  audience text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.ambassador_codes%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.ambassador_codes
    WHERE upper(code) = upper(trim(p_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'unknown', NULL::uuid, NULL::text, NULL::text[], NULL::integer, NULL::text;
    RETURN;
  END IF;
  IF NOT v.is_active THEN
    RETURN QUERY SELECT false, 'inactive', v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;
  IF v.expires_at IS NOT NULL AND v.expires_at < now() THEN
    RETURN QUERY SELECT false, 'expired', v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.ambassador_redemptions r WHERE r.code_id = v.id AND r.user_id = p_user_id) THEN
    RETURN QUERY SELECT false, 'already', v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;
  IF v.redemptions_used >= v.max_redemptions THEN
    RETURN QUERY SELECT false, 'exhausted', v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;

  UPDATE public.ambassador_codes SET redemptions_used = redemptions_used + 1 WHERE id = v.id;
  INSERT INTO public.ambassador_redemptions (code_id, user_id) VALUES (v.id, p_user_id);

  RETURN QUERY SELECT true, 'ok', v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ambassador_code(text, uuid) FROM public, anon, authenticated;

-- Ambassadors are published on the site; codes and redemptions never are.
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pub_read_active_ambassadors ON public.ambassadors;
CREATE POLICY pub_read_active_ambassadors ON public.ambassadors
  FOR SELECT USING (is_active = true);

-- No policy on ambassador_codes or ambassador_redemptions, deliberately. RLS
-- with no policy denies everyone: a code that anybody could read is not a
-- code, and who redeemed what is nobody else's business. Both are reached
-- only through the service role.

NOTIFY pgrst, 'reload schema';
