-- Checkpoint 15: keep talent and employer identities separate at the database
-- boundary. Service-role operations still bypass RLS for approved admin work.

drop policy if exists employer_insert_own on public.employer_profiles;
create policy employer_insert_own
on public.employer_profiles
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('employer', 'admin')
  )
);

drop policy if exists candidate_insert_own on public.candidate_profiles;
create policy candidate_insert_own
on public.candidate_profiles
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('candidate', 'talent', 'admin')
  )
);
