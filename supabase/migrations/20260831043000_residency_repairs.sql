-- Residency repairs (31 Aug 2026). Additive, idempotent, safe to run twice.

-- Who made the current counter-offer: nobody may accept their own counter.
alter table public.residency_bookings add column if not exists countered_by text
  check (countered_by in ('candidate','employer'));

-- residency_conversations existed only in the live database - recorded here
-- so the schema can be rebuilt. No-op where the table already exists.
create table if not exists public.residency_conversations (
  id uuid primary key default gen_random_uuid(),
  residency_profile_id uuid not null,
  candidate_id uuid,
  employer_id uuid not null,
  started_by uuid,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists residency_conversations_pair_uidx
  on public.residency_conversations (residency_profile_id, employer_id);
alter table public.residency_conversations enable row level security;
revoke all on table public.residency_conversations from anon, authenticated;
grant all on table public.residency_conversations to service_role;

notify pgrst, 'reload schema';
