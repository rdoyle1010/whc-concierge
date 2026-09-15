-- A code typed off a poster.
--
-- The comment beside normaliseCode said a code was "matched loosely, because
-- it is typed off a poster or read down the phone". It was not. The lookup was
--
--   upper(code) = upper(trim(p_code))
--
-- which forgives the case and the outer spaces and nothing else. SPA-WELL26
-- worked. spa well 26 did not. spawell26 did not. Neither did SPA WELL 26,
-- which is what a person reading it off an Instagram caption types about half
-- the time, and what they got back was "We do not recognise that code" - the
-- one message guaranteed to make somebody assume the offer was fake and close
-- the tab.
--
-- Punctuation is now thrown away on both sides, so the four of them are one
-- code. The stored value keeps its hyphen, because SPA-WELL26 is what goes on
-- the poster and what should appear in the admin list; only the comparison is
-- loosened.

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
    WHERE regexp_replace(upper(code), '[^A-Z0-9]', '', 'g')
        = regexp_replace(upper(trim(p_code)), '[^A-Z0-9]', '', 'g')
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'unknown'::text, NULL::uuid, NULL::text, NULL::text[], NULL::integer, NULL::text;
    RETURN;
  END IF;

  IF NOT v.is_active THEN
    RETURN QUERY SELECT false, 'inactive'::text, v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;

  IF v.expires_at IS NOT NULL AND v.expires_at < now() THEN
    RETURN QUERY SELECT false, 'expired'::text, v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.ambassador_redemptions r
             WHERE r.code_id = v.id AND r.user_id = p_user_id) THEN
    RETURN QUERY SELECT false, 'already'::text, v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;

  IF v.redemptions_used >= v.max_redemptions THEN
    RETURN QUERY SELECT false, 'exhausted'::text, v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
    RETURN;
  END IF;

  UPDATE public.ambassador_codes SET redemptions_used = redemptions_used + 1 WHERE id = v.id;
  INSERT INTO public.ambassador_redemptions (code_id, user_id) VALUES (v.id, p_user_id);

  RETURN QUERY SELECT true, 'ok'::text, v.id, v.reward, v.reward_slugs, v.reward_quantity, v.audience;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ambassador_code(text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ambassador_code(text, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
