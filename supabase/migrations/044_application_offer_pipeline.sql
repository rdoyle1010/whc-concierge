create table if not exists public.application_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  salary_amount numeric,
  salary_period text default 'annual' check (salary_period in ('annual','monthly','daily','hourly')),
  start_date date,
  employer_note text,
  candidate_note text,
  status text not null default 'offered' check (status in ('offered','accepted','declined','withdrawn')),
  offered_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.application_offers enable row level security;
revoke all on table public.application_offers from anon, authenticated;
grant all on table public.application_offers to service_role;

create index if not exists application_offers_status_idx on public.application_offers(status);
