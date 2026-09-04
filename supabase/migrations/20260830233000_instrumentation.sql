-- Instrumentation layer (30 Aug 2026): behavioural events, placement records,
-- salary history and verification provenance. Additive only - run in the
-- Supabase SQL Editor. Idempotent, safe to run twice.
--
-- Why: every future metric (fill rate, time to hire, salary intelligence)
-- depends on recording outcomes and history NOW. See docs/data-dictionary.md.

-- 1. Behavioural events: one append-only table, service-role only.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  actor_user_id uuid,
  candidate_id uuid,
  employer_id uuid,
  job_id uuid,
  application_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_time_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_candidate_idx on public.analytics_events(candidate_id) where candidate_id is not null;
create index if not exists analytics_events_employer_idx on public.analytics_events(employer_id) where employer_id is not null;
create index if not exists analytics_events_job_idx on public.analytics_events(job_id) where job_id is not null;
alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant all on table public.analytics_events to service_role;

-- 2. Placements: the permanent record of a completed hire, with the
-- confirmed salary from the accepted offer. Created at hire-confirmed and
-- never deleted (survives the application being archived).
create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications(id) on delete set null,
  candidate_id uuid not null,
  employer_id uuid not null,
  job_id uuid,
  job_title text,
  role_level text,
  source text not null default 'direct' check (source in ('direct','managed','residency','executive_search')),
  salary_amount numeric,
  salary_period text check (salary_period in ('annual','monthly','daily','hourly')),
  start_date date,
  hired_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists placements_candidate_idx on public.placements(candidate_id);
create index if not exists placements_employer_idx on public.placements(employer_id);
create index if not exists placements_hired_idx on public.placements(hired_at desc);
alter table public.placements enable row level security;
revoke all on table public.placements from anon, authenticated;
grant all on table public.placements to service_role;

-- 3. Salary history with provenance: dated rows, never overwritten.
-- kind says what the number is; source says who asserted it.
create table if not exists public.salary_records (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid,
  employer_id uuid,
  job_id uuid,
  placement_id uuid references public.placements(id) on delete set null,
  kind text not null check (kind in ('expectation','advertised','confirmed','agency_rate')),
  amount_min numeric,
  amount_max numeric,
  period text not null default 'annual' check (period in ('annual','monthly','daily','hourly')),
  role_level text,
  source text not null check (source in ('candidate_declared','employer_advertised','employer_confirmed','platform_transaction')),
  recorded_at timestamptz not null default now()
);
create index if not exists salary_records_kind_time_idx on public.salary_records(kind, recorded_at desc);
create index if not exists salary_records_candidate_idx on public.salary_records(candidate_id) where candidate_id is not null;
alter table public.salary_records enable row level security;
revoke all on table public.salary_records from anon, authenticated;
grant all on table public.salary_records to service_role;

-- 4. Verification provenance on certifications (is_verified already exists;
-- these record when and on what basis).
alter table public.candidate_certifications add column if not exists verified_at timestamptz;
alter table public.candidate_certifications add column if not exists verified_source text
  check (verified_source in ('document_verified','employer_confirmed','academy_assessed'));

notify pgrst, 'reload schema';
