ALTER TABLE public.residency_bookings
  ADD COLUMN IF NOT EXISTS payout_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'residency_bookings_dispute_status_check'
      AND conrelid = 'public.residency_bookings'::regclass
  ) THEN
    ALTER TABLE public.residency_bookings
      ADD CONSTRAINT residency_bookings_dispute_status_check
      CHECK (dispute_status IN ('none','open','resolved'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.guard_residency_payout_after_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.payout_status = 'paid' AND COALESCE(OLD.payout_status, '') <> 'paid' THEN
    IF NEW.paid_at IS NULL THEN
      RAISE EXCEPTION 'Residency payout cannot be marked paid before property payment is recorded';
    END IF;
    IF NEW.end_date IS NULL OR (now() AT TIME ZONE 'Europe/London')::date <= NEW.end_date THEN
      RAISE EXCEPTION 'Residency payout cannot be marked paid until after the residency end date';
    END IF;
    IF NEW.status NOT IN ('confirmed','completed') THEN
      RAISE EXCEPTION 'Residency payout is only allowed for confirmed bookings';
    END IF;
    IF NEW.dispute_status = 'open' THEN
      RAISE EXCEPTION 'Residency payout cannot be marked paid while a dispute is open';
    END IF;
    NEW.payout_at := COALESCE(NEW.payout_at, now());
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_residency_payout_after_completion() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_residency_payout_after_completion() TO service_role;

DROP TRIGGER IF EXISTS trg_guard_residency_payout_after_completion ON public.residency_bookings;
CREATE TRIGGER trg_guard_residency_payout_after_completion
BEFORE UPDATE OF payout_status ON public.residency_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_residency_payout_after_completion();
