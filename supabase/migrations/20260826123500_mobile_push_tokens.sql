create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text,
  device_name text,
  app_version text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mobile_push_tokens enable row level security;

grant select, insert, update, delete on public.mobile_push_tokens to authenticated;

create policy "Users can read own mobile push tokens"
on public.mobile_push_tokens for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own mobile push tokens"
on public.mobile_push_tokens for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own mobile push tokens"
on public.mobile_push_tokens for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own mobile push tokens"
on public.mobile_push_tokens for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists mobile_push_tokens_user_id_idx on public.mobile_push_tokens(user_id);
