-- Agency payout integrity (1 Sep 2026). Additive only - run in the Supabase
-- SQL Editor. Idempotent, safe to run twice.
--
-- Why: an agency payout could be marked "paid" with nothing behind it, and
-- WHC held the professional's money between the property's payment and the
-- manual bank transfer. These columns record HOW each payout moved
-- (stripe_connect destination charge or manual bank transfer), the bank
-- reference behind a manual settlement, and which admin confirmed it.
-- The stripe_events ledger makes every webhook branch replay-safe.

-- 1. How the shift money actually reached the professional.
alter table public.agency_bookings add column if not exists stripe_transfer_id text;
alter table public.agency_bookings add column if not exists payout_reference text;
alter table public.agency_bookings add column if not exists payout_method text;
alter table public.agency_bookings add column if not exists payout_confirmed_by uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agency_bookings_payout_method_check'
  ) then
    alter table public.agency_bookings
      add constraint agency_bookings_payout_method_check
      check (payout_method is null or payout_method in ('stripe_connect', 'manual'));
  end if;
end $$;

create index if not exists agency_bookings_payout_method_idx
  on public.agency_bookings(payout_method) where payout_method is not null;

-- 2. Stripe event ledger: the webhook inserts every verified event id before
-- it does any work, so a Stripe replay is a duplicate key and a no-op rather
-- than a second fulfilment. Service-role only, never exposed to the browser.
create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  created_at timestamptz not null default now(),
  payload jsonb
);
create index if not exists stripe_events_type_time_idx on public.stripe_events(type, created_at desc);
alter table public.stripe_events enable row level security;
revoke all on table public.stripe_events from public, anon, authenticated;
grant all on table public.stripe_events to service_role;

notify pgrst, 'reload schema';
