-- Managed recruitment intake (31 Aug 2026). Employers ask WHC to run the
-- search (12.5% of first-year salary, pay on placement). Additive, idempotent.

create table if not exists public.recruitment_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  service text not null default 'managed' check (service in ('managed','executive')),
  job_title text not null,
  role_level text,
  salary_min numeric,
  salary_max numeric,
  location text,
  timeline text,
  brief text not null,
  status text not null default 'new' check (status in ('new','reviewing','search_active','shortlist_sent','placed','closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recruitment_requests_employer_idx on public.recruitment_requests(employer_id, created_at desc);
create index if not exists recruitment_requests_status_idx on public.recruitment_requests(status);
alter table public.recruitment_requests enable row level security;
revoke all on table public.recruitment_requests from anon, authenticated;
grant all on table public.recruitment_requests to service_role;

notify pgrst, 'reload schema';
