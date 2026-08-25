alter table public.agency_cases drop constraint if exists agency_cases_status_check;
alter table public.agency_cases add constraint agency_cases_status_check check (status in ('open','awaiting_response','under_review','awaiting_agreement','awaiting_payment','resolved','rejected'));

alter table public.agency_cases add column if not exists proposed_resolution text;
alter table public.agency_cases add column if not exists proposed_refund_amount numeric(10,2) not null default 0;
alter table public.agency_cases add column if not exists proposed_extra_amount numeric(10,2) not null default 0;
alter table public.agency_cases add column if not exists proposed_payout_amount numeric(10,2);
alter table public.agency_cases add column if not exists candidate_agreed_at timestamptz;
alter table public.agency_cases add column if not exists employer_agreed_at timestamptz;
alter table public.agency_cases add column if not exists candidate_agreed_by uuid;
alter table public.agency_cases add column if not exists employer_agreed_by uuid;

create table if not exists public.agency_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.agency_cases(id) on delete cascade,
  sender_user_id uuid not null,
  sender_role text not null check (sender_role in ('candidate','employer','admin')),
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists agency_case_messages_case_idx on public.agency_case_messages(case_id, created_at asc);
alter table public.agency_case_messages enable row level security;
