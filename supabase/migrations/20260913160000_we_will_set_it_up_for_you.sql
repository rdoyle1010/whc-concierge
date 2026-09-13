-- "Send us your CV and we will do the rest."
--
-- Fourteen people signed up in the first fortnight and not one finished a
-- profile. Nobody is going to fill in fifteen fields for a platform they
-- joined ten minutes ago and have not yet been paid a penny by, and asking
-- them to is asking for effort in exchange for a promise.
--
-- So the order is reversed. They send a CV, we build the profile, and the
-- first thing they are ever asked to do is set a password on something that
-- is already finished. No account, no form, no password before there is
-- anything to log into.
--
-- The consent column is not decoration. Building somebody's profile means
-- holding their CV and signing into their account to fill it in, and that is
-- only defensible if they asked us to in writing.

create table if not exists public.profile_build_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  -- Anything they want to tell us that a CV does not say.
  note text,
  -- Path in the private talent-documents bucket. Never a public URL.
  cv_path text,
  cv_filename text,
  -- Written at the moment they ticked the box, with the wording they saw.
  consent_given_at timestamptz not null default now(),
  consent_wording text not null,
  status text not null default 'new'
    check (status in ('new','building','sent','done','declined')),
  -- Set once the account exists, so the queue and the register agree.
  created_user_id uuid references auth.users(id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_build_requests_status_idx
  on public.profile_build_requests(status, created_at desc);
create index if not exists profile_build_requests_email_idx
  on public.profile_build_requests(lower(email));

alter table public.profile_build_requests enable row level security;
revoke all on table public.profile_build_requests from anon, authenticated;
grant all on table public.profile_build_requests to service_role;

-- Signing in as somebody to build their profile is the most sensitive thing
-- an administrator can do here, so every use is written down: who did it, to
-- whom, and when. Kept separate from the request row because the record has
-- to survive the request being deleted.
create table if not exists public.profile_build_access_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  admin_email text,
  target_user_id uuid not null,
  target_email text,
  request_id uuid,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists profile_build_access_log_target_idx
  on public.profile_build_access_log(target_user_id, created_at desc);

alter table public.profile_build_access_log enable row level security;
revoke all on table public.profile_build_access_log from anon, authenticated;
grant all on table public.profile_build_access_log to service_role;
