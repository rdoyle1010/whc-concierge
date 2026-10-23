-- Counting the people who never sign up.
--
-- Every number on this platform so far describes somebody who registered. The
-- most useful number at launch is the other one: how many people came, what
-- they looked at, and how many of them left without doing anything. Without it
-- there is no way to tell a quiet week from a broken funnel.
--
-- No cookie and no identifier is stored on the visitor's device. A visitor is
-- a salted hash of address and browser that rotates every day, which is enough
-- to stop one person counting as forty and not enough to follow anybody from
-- one day to the next. That is deliberate: it keeps the Decline button on the
-- cookie banner honest, because there is nothing here for it to decline.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  -- London calendar day, written by the application rather than derived from
  -- created_at, because a visit at 00:30 BST is today and not yesterday.
  day date not null,
  path text not null,
  -- Daily-rotating salted hash. Not reversible, and not the same hash
  -- tomorrow for the same person.
  visitor_hash text not null,
  referrer_host text,
  device text check (device in ('mobile','tablet','desktop')),
  -- Whether this visit belonged to somebody signed in. The interesting
  -- number is the false one.
  signed_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- One row per visitor per page per day. A refresh, a back button and a second
-- visit at teatime all collapse into the row that is already there.
create unique index if not exists site_visits_unique_idx
  on public.site_visits(day, visitor_hash, path);
create index if not exists site_visits_day_idx on public.site_visits(day desc);
create index if not exists site_visits_path_idx on public.site_visits(path, day desc);

alter table public.site_visits enable row level security;
revoke all on table public.site_visits from anon, authenticated;
grant all on table public.site_visits to service_role;
