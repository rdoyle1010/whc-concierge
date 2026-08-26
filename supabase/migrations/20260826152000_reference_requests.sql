create table if not exists public.reference_requests (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','completed','declined')),
  request_message text,
  response_text text,
  would_rehire boolean,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(candidate_id, employer_id)
);

alter table public.reference_requests enable row level security;
grant select on table public.reference_requests to authenticated;
revoke insert, update, delete on table public.reference_requests from anon, authenticated;

drop policy if exists "Reference requests visible to participants" on public.reference_requests;
create policy "Reference requests visible to participants"
on public.reference_requests for select
to authenticated
using (
  exists (select 1 from public.candidate_profiles c where c.id = reference_requests.candidate_id and c.user_id = (select auth.uid()))
  or exists (select 1 from public.employer_profiles e where e.id = reference_requests.employer_id and e.user_id = (select auth.uid()))
);

create index if not exists reference_requests_candidate_idx on public.reference_requests(candidate_id, created_at desc);
create index if not exists reference_requests_employer_idx on public.reference_requests(employer_id, created_at desc);

notify pgrst, 'reload schema';
