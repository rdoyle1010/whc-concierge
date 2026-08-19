alter table public.applications
  add column if not exists hired_at timestamptz,
  add column if not exists archived_at timestamptz;

create index if not exists applications_archived_at_idx
  on public.applications(archived_at);
