-- 20260901160000: Agency money held to the penny, and payments made traceable.
--
-- Additive and idempotent. Safe to run more than once, and safe to run before
-- or after any other migration in this folder. Every existing value survives
-- unchanged - widening an integer column to numeric(10,2) preserves the whole
-- pounds already stored.
--
-- WHY
--
-- Three defects, all of which cost real money.
--
--  1. The agency money columns were `integer`, so they could only hold whole
--     pounds. A half-hour shift collects £440.50 and the platform recorded
--     £440. That figure is the ceiling on every refund and the basis of the
--     revenue report, so the ledger drifted below Stripe by up to 99p on
--     every fractional-hour booking, always in the customer's disfavour when
--     refunding.
--
--  2. Nothing recorded the Stripe Checkout Session for a booking. A property
--     that went back and pressed Pay again ended up with two live sessions,
--     both valid for 24 hours. Paying both charged them twice for one shift
--     and nothing anywhere recorded the second payment.
--
--  3. Nothing recorded a refund or a chargeback. A property could dispute a
--     charge, Stripe could pull the money back, and the admin money page
--     would still show the booking as ready to pay out.

-- ---------------------------------------------------------------------------
-- 1. Money to the penny.
-- ---------------------------------------------------------------------------
-- The trigger below casts to integer, so it is dropped for the duration of
-- the type change and recreated in its numeric form underneath.
DROP TRIGGER IF EXISTS trg_enforce_agency_full_rate_payout ON public.agency_bookings;
DROP TRIGGER IF EXISTS enforce_agency_full_rate_payout_trigger ON public.agency_bookings;

DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['amount_paid', 'payout_amount', 'refund_amount', 'admin_fee_retained', 'platform_fee'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agency_bookings'
        AND column_name = target AND data_type <> 'numeric'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.agency_bookings ALTER COLUMN %I TYPE numeric(10,2) USING %I::numeric',
        target, target
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. One shift, one live checkout; and a record of money going back out.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agency_bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE INDEX IF NOT EXISTS agency_bookings_checkout_session_idx
  ON public.agency_bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Reversals are looked up by payment intent when Stripe reports a refund or a
-- dispute, on both money-bearing tables.
CREATE INDEX IF NOT EXISTS agency_bookings_payment_intent_idx
  ON public.agency_bookings(stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.residency_bookings') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'residency_bookings'
         AND column_name = 'stripe_payment_intent'
     ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS residency_bookings_payment_intent_idx
             ON public.residency_bookings(stripe_payment_intent)
             WHERE stripe_payment_intent IS NOT NULL';
  END IF;
END $$;

COMMENT ON COLUMN public.agency_bookings.stripe_checkout_session_id IS
  'The live Stripe Checkout Session for this booking. Reused rather than recreated, so one shift can never hold two payable sessions.';
COMMENT ON COLUMN public.agency_bookings.refunded_at IS
  'When money was refunded or charged back on this booking. Set by the Stripe webhook, never by hand.';

-- ---------------------------------------------------------------------------
-- 3. The payout trigger, in numeric.
-- ---------------------------------------------------------------------------
-- Unchanged in behaviour except that it no longer rounds the professional's
-- payout to a whole pound. A payout adjudicated in a resolved dispute is still
-- honoured exactly as agreed rather than recomputed.
CREATE OR REPLACE FUNCTION public.enforce_agency_full_rate_payout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  if coalesce(new.payout_status, 'pending') <> 'paid' then
    if coalesce(new.dispute_status, '') in ('resolved', 'open') and new.payout_amount is not null then
      return new;
    end if;
    new.payout_amount := round(
      coalesce(new.rate, 0)::numeric * coalesce(nullif(new.hours, 0), 8)::numeric,
      2
    );
  end if;
  return new;
end;
$$;

-- Dropped first so this whole migration can be run twice without an error.
-- These are pasted into the SQL editor by hand, and a block that fails
-- halfway is worse than one that is simply run again.
DROP TRIGGER IF EXISTS trg_enforce_agency_full_rate_payout ON public.agency_bookings;

CREATE TRIGGER trg_enforce_agency_full_rate_payout
  BEFORE INSERT OR UPDATE OF paid_at, payout_amount, rate, hours, payout_status
  ON public.agency_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_agency_full_rate_payout();

NOTIFY pgrst, 'reload schema';
