-- Events, and being the first to know about them.
--
-- Professionals told us plainly what they want from a platform like this, and
-- most of it is not a job. It is somewhere their qualifications count, courses
-- that carry weight, and knowing what is happening before everybody else:
-- brand launches, masterclasses, product house training, trade shows.
--
-- That matters commercially as much as it does editorially. Perhaps five per
-- cent of spa professionals are looking for work at any moment; all of them
-- want to know what is on. A reason to open our emails every week that costs
-- a therapist nothing to be seen wanting is worth more than another push to
-- declare herself available.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  -- One line for the card, the full thing for the page.
  summary text,
  description text,
  kind text not null default 'other'
    check (kind in ('launch','masterclass','training','trade_show','networking','awards','other')),
  -- Who is running it: a product house, a property, a body, or us.
  host text,
  location text,
  -- Online events have no address and should not pretend to.
  is_online boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz,
  -- Where to book. Ours or somebody else's; either is useful.
  booking_url text,
  image_url text,
  -- Members-only events are the reason to have an account.
  members_only boolean not null default false,
  is_published boolean not null default false,
  -- Set when the register has been told, so nobody is emailed twice about the
  -- same event by a second press of the same button.
  announced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists events_published_idx on public.events(is_published, starts_at);

alter table public.events enable row level security;

-- Read-only to the public, and only what is published. Everything else goes
-- through the service role.
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
  for select to anon, authenticated
  using (is_published = true);

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon, authenticated;
grant all on table public.events to service_role;
