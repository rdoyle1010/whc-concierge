create table if not exists public.agency_cases (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.agency_bookings(id) on delete cascade,
  opened_by_user_id uuid not null,
  opened_by_role text not null check (opened_by_role in ('employer','candidate')),
  issue_type text not null,
  description text not null,
  actual_start_time time,
  actual_end_time time,
  requested_adjustment_type text not null default 'none' check (requested_adjustment_type in ('none','refund','additional_payment')),
  requested_amount numeric(10,2),
  requested_reason text,
  status text not null default 'open' check (status in ('open','awaiting_response','under_review','awaiting_payment','resolved','rejected')),
  counterparty_response text,
  counterparty_response_user_id uuid,
  counterparty_responded_at timestamptz,
  admin_notes text,
  resolution text,
  approved_refund_amount numeric(10,2) not null default 0,
  approved_extra_amount numeric(10,2) not null default 0,
  adjusted_payout_amount numeric(10,2),
  extra_payment_status text not null default 'none' check (extra_payment_status in ('none','pending','paid')),
  extra_stripe_session_id text,
  extra_paid_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_cases_booking_idx on public.agency_cases(booking_id, created_at desc);
create index if not exists agency_cases_status_idx on public.agency_cases(status, created_at desc);
create unique index if not exists agency_cases_one_open_per_booking_idx
  on public.agency_cases(booking_id)
  where status in ('open','awaiting_response','under_review','awaiting_payment');

create table if not exists public.agency_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.agency_cases(id) on delete cascade,
  actor_user_id uuid,
  actor_role text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agency_case_events_case_idx on public.agency_case_events(case_id, created_at asc);

alter table public.agency_cases enable row level security;
alter table public.agency_case_events enable row level security;

create or replace function public.touch_agency_case() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_touch_agency_case on public.agency_cases;
create trigger trg_touch_agency_case before update on public.agency_cases for each row execute function public.touch_agency_case();
