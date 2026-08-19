create table if not exists public.application_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 3),
  interview_method text not null check (interview_method in ('teams','video','phone','in_person')),
  proposed_slots jsonb not null default '[]'::jsonb,
  selected_slot timestamptz,
  status text not null default 'proposed' check (status in ('proposed','confirmed','cancelled','completed')),
  employer_note text,
  candidate_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, round_number),
  check (jsonb_typeof(proposed_slots) = 'array'),
  check (jsonb_array_length(proposed_slots) between 1 and 4)
);

alter table public.application_interviews enable row level security;
revoke all on table public.application_interviews from anon, authenticated;
grant all on table public.application_interviews to service_role;

create index if not exists application_interviews_application_idx
  on public.application_interviews(application_id);
create index if not exists application_interviews_status_idx
  on public.application_interviews(status);
