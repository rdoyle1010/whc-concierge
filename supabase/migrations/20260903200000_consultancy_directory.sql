-- The Consultancy directory.
--
-- Agency sells hours and Residency sells weeks. Consultancy sells judgement,
-- which is bought on evidence rather than on a rate card - so the listing is
-- built around projects and outcomes, not availability.
--
-- Free to enter, deliberately. A directory nobody is in has nothing to show a
-- hotel, and a consultant will not pay to find out whether it works. Revenue
-- comes from the ones who want to be seen first, through the featured slot.

create table if not exists public.consultancy_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Many consultants trade under a practice name rather than their own.
  practice_name text not null,
  contact_name text,
  headline text,
  summary text,
  specialisms text[] not null default '{}',
  engagement_types text[] not null default '{}',
  -- Projects and their outcomes, held together so the order a consultant
  -- chooses is the order a hotel reads:
  --   [{"title":"...","client":"...","confidential":true,"outcome":"..."}]
  projects jsonb not null default '[]'::jsonb,
  years_experience integer,
  based_in text,
  works_with text not null default 'uk',
  -- A showcase that hides the consultant's own website has nothing to show.
  -- These are published as given, unlike Residency where contact is withheld
  -- until a booking is confirmed.
  website_url text,
  linkedin_url text,
  logo_url text,
  cover_image_url text,
  day_rate_from integer,
  -- The consultant decides when it goes live; WHC decides whether it stays.
  is_live boolean not null default false,
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected')),
  approval_notes text,
  -- The paid slot. featured_until is what actually expires it, so a lapsed
  -- subscription cannot leave somebody at the top of the directory for ever.
  featured boolean not null default false,
  featured_until timestamptz,
  view_count integer not null default 0,
  enquiry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One listing per person: a second listing is a second entry in the same
-- directory competing with the first, which helps nobody.
create unique index if not exists consultancy_profiles_user_idx
  on public.consultancy_profiles(user_id);
-- The directory is browsed by specialism, which is containment, not equality.
create index if not exists consultancy_specialisms_idx
  on public.consultancy_profiles using gin (specialisms);
create index if not exists consultancy_live_idx
  on public.consultancy_profiles(is_live, approval_status, featured desc, updated_at desc);

-- An enquiry is the moment the directory earns its place, so it is a record in
-- its own right rather than only a message in an inbox: it is what proves the
-- product works, and what a consultant is later asked to pay to receive more of.
create table if not exists public.consultancy_enquiries (
  id uuid primary key default gen_random_uuid(),
  consultancy_id uuid not null references public.consultancy_profiles(id) on delete cascade,
  employer_id uuid references public.employer_profiles(id) on delete set null,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  property_name text,
  subject text,
  message text not null,
  budget_band text,
  timeline text,
  status text not null default 'new'
    check (status in ('new','read','responded','closed')),
  created_at timestamptz not null default now()
);
create index if not exists consultancy_enquiries_consultancy_idx
  on public.consultancy_enquiries(consultancy_id, created_at desc);
create index if not exists consultancy_enquiries_sender_idx
  on public.consultancy_enquiries(from_user_id, created_at desc);

alter table public.consultancy_profiles enable row level security;
alter table public.consultancy_enquiries enable row level security;

-- Anyone may read a listing that is live and approved. That is the point of a
-- public directory, and it is the same read policy Residency uses.
drop policy if exists "Public read live consultancies" on public.consultancy_profiles;
create policy "Public read live consultancies" on public.consultancy_profiles
  for select using (is_live = true and approval_status = 'approved');

drop policy if exists "Owners read own consultancy" on public.consultancy_profiles;
create policy "Owners read own consultancy" on public.consultancy_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Owners write own consultancy" on public.consultancy_profiles;
create policy "Owners write own consultancy" on public.consultancy_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owners update own consultancy" on public.consultancy_profiles;
create policy "Owners update own consultancy" on public.consultancy_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enquiries are readable by the consultant they were sent to and by whoever
-- sent them, and by nobody else. Writes go through the service role so the
-- enquiry, the message and the notification are made together or not at all.
drop policy if exists "Consultant reads own enquiries" on public.consultancy_enquiries;
create policy "Consultant reads own enquiries" on public.consultancy_enquiries
  for select using (
    auth.uid() = from_user_id
    or exists (
      select 1 from public.consultancy_profiles profile
      where profile.id = consultancy_enquiries.consultancy_id and profile.user_id = auth.uid()
    )
  );

-- The featured slot, priced alongside every other product so it can be
-- changed in admin Settings rather than in code.
insert into public.commercial_settings(product_key, label, description, price_pence, billing_interval, is_active)
values ('consultancy_featured', 'Featured Consultancy',
  'Thirty days at the top of the Consultancy directory with the Featured mark and an enlarged listing.',
  14900, 'one_off', true)
on conflict (product_key) do nothing;

-- A view counter has to be an atomic increment. Read-then-write from the
-- application loses counts the moment two hotels open the same listing at
-- once, and the number a consultant is shown has to be one they can trust.
create or replace function public.increment_consultancy_view(profile_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.consultancy_profiles
  set view_count = view_count + 1
  where id = profile_id and is_live = true and approval_status = 'approved';
$$;

revoke all on function public.increment_consultancy_view(uuid) from public;
grant execute on function public.increment_consultancy_view(uuid) to service_role;

analyze public.consultancy_profiles;
