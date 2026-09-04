-- Stripe Connect payouts (31 Aug 2026). Specialists connect a Stripe
-- Express account; residency payouts become real transfers with a manual
-- fallback. Additive, idempotent - safe to run twice.

alter table public.candidate_profiles add column if not exists stripe_connect_account_id text;
alter table public.candidate_profiles add column if not exists connect_payouts_enabled boolean not null default false;

alter table public.residency_bookings add column if not exists payout_method text
  check (payout_method in ('stripe','manual'));
alter table public.residency_bookings add column if not exists stripe_transfer_id text;

notify pgrst, 'reload schema';
