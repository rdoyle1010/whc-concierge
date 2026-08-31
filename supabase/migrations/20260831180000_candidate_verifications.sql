-- Candidate verifications (31 Aug 2026): structured manual verification marks
-- awarded by WHC admins (employment, qualifications, references, WHC
-- assessment, manager approval). Hotels buy reduced risk, so each mark is a
-- discrete, auditable row rather than free text. Additive and idempotent.
-- Service-role access only - admins act through the admin API.

create table if not exists public.candidate_verifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  type text not null,
  granted_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique(candidate_id, type)
);
create index if not exists candidate_verifications_candidate_idx on public.candidate_verifications(candidate_id, created_at desc);
alter table public.candidate_verifications enable row level security;
revoke all on table public.candidate_verifications from anon, authenticated;
grant all on table public.candidate_verifications to service_role;

notify pgrst, 'reload schema';
