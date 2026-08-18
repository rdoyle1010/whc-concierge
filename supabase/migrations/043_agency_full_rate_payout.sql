-- Agency commercial model confirmed 18 Aug 2026:
-- the property pays the agreed shift value plus the 10% WHC booking fee,
-- and the therapist receives 100% of the agreed shift rate.

CREATE OR REPLACE FUNCTION public.enforce_agency_full_rate_payout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.paid_at IS NOT NULL AND COALESCE(NEW.payout_status, 'pending') <> 'paid' THEN
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

-- Correct paid but not yet paid-out bookings to the newly confirmed model.
-- Historical payouts already marked paid are deliberately left unchanged.
UPDATE public.agency_bookings
SET payout_amount = ROUND(
  COALESCE(rate, 0)::numeric * COALESCE(NULLIF(hours, 0), 8)::numeric
)::integer
WHERE paid_at IS NOT NULL
  AND COALESCE(payout_status, 'pending') <> 'paid';
