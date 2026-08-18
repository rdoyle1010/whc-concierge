-- Residency marketplace: paid talent membership + structured hotel offers.

alter table public.candidate_profiles
  add column if not exists residency_member boolean not null default false,
  add column if not exists residency_subscription_id text,
  add column if not exists residency_subscription_status text,
  add column if not exists residency_subscription_ends_at timestamptz;

create table if not exists public.residency_bookings (
  id uuid primary key default gen_random_uuid(),
  residency_profile_id uuid not null references public.residency_profiles(id) on delete cascade,
  candidate_id uuid references public.candidate_profiles(id) on delete set null,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  property_name text not null,
  start_date date not null,
  end_date date not null,
  days_required integer not null check (days_required > 0 and days_required <= 180),
  proposed_day_rate numeric(10,2) not null check (proposed_day_rate > 0),
  agreed_day_rate numeric(10,2),
  proposed_total numeric(12,2) not null check (proposed_total > 0),
  agreed_total numeric(12,2),
  platform_fee numeric(12,2),
  amount_paid numeric(12,2),
  payout_amount numeric(12,2),
  payout_status text not null default 'not_due' check (payout_status in ('not_due','pending','paid','held','cancelled')),
  accommodation_included boolean not null default false,
  travel_included boolean not null default false,
  services_required text,
  notes text,
  status text not null default 'offered' check (status in ('offered','countered','accepted','confirmed','completed','declined','cancelled')),
  paid_at timestamptz,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists residency_bookings_candidate_idx on public.residency_bookings(candidate_id, created_at desc);
create index if not exists residency_bookings_employer_idx on public.residency_bookings(employer_id, created_at desc);
create index if not exists residency_bookings_profile_idx on public.residency_bookings(residency_profile_id, created_at desc);

alter table public.residency_bookings enable row level security;

-- New Supabase projects do not necessarily expose newly-created public tables
-- to the Data API automatically, so grant only the read capability the two
-- browser dashboards need. All writes remain in authenticated server routes.
grant select on table public.residency_bookings to authenticated;
revoke insert, update, delete on table public.residency_bookings from anon, authenticated;

-- Reads are limited to the employer who made the offer and the talent who owns the candidate profile.
drop policy if exists "Residency bookings visible to participants" on public.residency_bookings;
create policy "Residency bookings visible to participants"
on public.residency_bookings for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.employer_profiles e
    where e.id = residency_bookings.employer_id and e.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.candidate_profiles c
    where c.id = residency_bookings.candidate_id and c.user_id = (select auth.uid())
  )
);

-- Writes go through authenticated server routes using the service-role client.
