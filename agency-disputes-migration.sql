-- Agency disputes + refunds migration (16 Jul 2026). Idempotent.
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_status text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_reason text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS dispute_requested text;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS refund_amount integer;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE agency_bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent text;
NOTIFY pgrst, 'reload schema';
