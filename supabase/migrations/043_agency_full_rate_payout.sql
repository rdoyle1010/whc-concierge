-- Agency commercial model confirmed 18 Aug 2026:
-- the property pays the agreed shift value plus the 10% WHC booking fee,
-- and the therapist receives 100% of the agreed shift rate.

CREATE OR REPLACE FUNCTION public.enforce_agency_full_rate_payout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Keep the agreed therapist amount visible and protected from booking creation
  -- onwards. Historical bookings already marked paid out are left untouched.
  IF COALESCE(NEW.payout_status, 'pending') <> 'paid' THEN
    NEW.payout_amount := ROUND(
      COALESCE(NEW.rate, 0)::numeric * COALESCE(NULLIF(NEW.hours, 0), 8)::numeric
    )::integer;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_agency_full_rate_payout() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_agency_full_rate_payout() TO service_role;

DROP TRIGGER IF EXISTS trg_enforce_agency_full_rate_payout ON public.agency_bookings;
CREATE TRIGGER trg_enforce_agency_full_rate_payout
BEFORE INSERT OR UPDATE OF paid_at, payout_amount, rate, hours, payout_status
ON public.agency_bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_agency_full_rate_payout();

-- Correct every booking that has not already been paid out to the newly
-- confirmed model, including accepted bookings still awaiting property payment.
UPDATE public.agency_bookings
SET payout_amount = ROUND(
  COALESCE(rate, 0)::numeric * COALESCE(NULLIF(hours, 0), 8)::numeric
)::integer
WHERE COALESCE(payout_status, 'pending') <> 'paid';
