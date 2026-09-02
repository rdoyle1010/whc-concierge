-- Phase 0: sector foundations
--
-- The platform is one marketplace with several doors. Spa & Wellness is the
-- door that exists today; Brands opens alongside it; Hospitality is built but
-- dark until there are employers behind it. A sector is the specific trade
-- inside a door - spa, beauty, fitness - and it is the unit everything else
-- hangs off: what a role is for, what a professional does, and what Agency
-- work in that trade is worth.
--
-- Nothing here changes what the live site does. Every existing role becomes a
-- spa role, every existing rate matches what Agency charges today, and the
-- doors that are not ready are seeded is_live = false so they cannot be
-- chosen or filtered until an administrator turns them on.
--
-- Safe to run more than once.

begin;

-- 1. Doors ------------------------------------------------------------------

create table if not exists public.doors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order integer not null default 0,
  is_live boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.doors (slug, label, sort_order, is_live) values
  ('spa_wellness', 'Spa & Wellness', 1, true),
  ('brands',       'Brands',         2, true),
  ('hospitality',  'Hospitality',    3, false)
on conflict (slug) do nothing;

-- 2. Sectors ----------------------------------------------------------------
-- door_id is nullable on purpose: Education is a sector that does not sit
-- under any single door, and is dark until it does.

create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  door_id uuid references public.doors(id) on delete set null,
  sort_order integer not null default 0,
  is_live boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_sectors_door on public.sectors(door_id);
create index if not exists idx_sectors_live on public.sectors(is_live) where is_live;

insert into public.sectors (slug, label, door_id, sort_order, is_live)
select v.slug, v.label, d.id, v.sort_order, v.is_live
from (values
  ('spa',              'Spa',               'spa_wellness', 1, true),
  ('beauty',           'Beauty',            'spa_wellness', 2, true),
  ('fitness',          'Fitness',           'spa_wellness', 3, true),
  ('pilates_yoga',     'Pilates & Yoga',    'spa_wellness', 4, true),
  ('recovery',         'Recovery',          'spa_wellness', 5, true),
  ('brand_education',  'Brand Education',   'brands',       1, true),
  ('brand_sales',      'Brand Sales',       'brands',       2, true),
  ('brand_ambassador', 'Brand Ambassador',  'brands',       3, true),
  ('events',           'Events',            'hospitality',  1, false),
  ('food_beverage',    'Food & Beverage',   'hospitality',  2, false),
  ('front_of_house',   'Front of House',    'hospitality',  3, false),
  ('housekeeping',     'Housekeeping',      'hospitality',  4, false)
) as v(slug, label, door_slug, sort_order, is_live)
join public.doors d on d.slug = v.door_slug
on conflict (slug) do nothing;

-- Education belongs to no door yet.
insert into public.sectors (slug, label, door_id, sort_order, is_live) values
  ('education', 'Education', null, 99, false)
on conflict (slug) do nothing;

-- 3. Every role belongs to a sector -----------------------------------------
-- Added nullable, backfilled to spa, then made required, so the column can be
-- introduced without a window where existing rows are invalid.

alter table public.job_listings add column if not exists sector_id uuid references public.sectors(id);

update public.job_listings
set sector_id = (select id from public.sectors where slug = 'spa')
where sector_id is null;

do $$
begin
  if exists (select 1 from public.sectors where slug = 'spa')
     and not exists (select 1 from public.job_listings where sector_id is null) then
    alter table public.job_listings alter column sector_id set not null;
  end if;
end $$;

create index if not exists idx_job_listings_sector on public.job_listings(sector_id);

-- 4. A professional works in several sectors --------------------------------

create table if not exists public.candidate_sectors (
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  sector_id uuid not null references public.sectors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, sector_id)
);

create index if not exists idx_candidate_sectors_sector on public.candidate_sectors(sector_id);

-- 5. What kind of employer this is ------------------------------------------
-- Hotels are no longer the only buyer: a product house, a studio or a clinic
-- hires differently and should not be described as a hotel.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'employer_type') then
    create type public.employer_type as enum
      ('hotel', 'resort', 'brand', 'studio', 'club', 'clinic', 'agency_client');
  end if;
end $$;

alter table public.employer_profiles
  add column if not exists employer_type public.employer_type not null default 'hotel';

-- 6. Agency rates per sector ------------------------------------------------
-- A pilates instructor and a spa therapist do not share a rate floor, so the
-- numbers Agency enforces move from code to a row an administrator can edit.
-- The fee is the live 15% throughout. The floors and minimums are Rebecca's,
-- set from what the market actually pays.
--
-- The shift minimums are the important part: an hour for fitness and for
-- class cover, because a single class is the whole job and a four-hour
-- minimum would refuse it outright. Brand education is priced as a
-- professional engagement rather than a shift - eight hours at £38 is a
-- £300 day.
--
-- These are floors. An employer may always offer more.

create table if not exists public.agency_rate_cards (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null unique references public.sectors(id) on delete cascade,
  -- The default is only reached when a sector is opened before anyone sets
  -- its rates, so it is deliberately conservative: too high gets corrected on
  -- the admin screen, too low lets a property underpay in the meantime.
  min_hourly_rate numeric(8,2) not null default 20.00,
  platform_fee_pct numeric(5,2) not null default 15.00,
  min_shift_minutes integer not null default 240,
  updated_at timestamptz not null default now(),
  constraint agency_rate_cards_fee_range check (platform_fee_pct >= 0 and platform_fee_pct <= 100),
  constraint agency_rate_cards_rate_positive check (min_hourly_rate > 0),
  constraint agency_rate_cards_shift_positive check (min_shift_minutes > 0)
);

insert into public.agency_rate_cards (sector_id, min_hourly_rate, platform_fee_pct, min_shift_minutes)
select s.id, v.min_hourly_rate, 15.00, v.min_shift_minutes
from (values
  ('spa',             20.00, 240),   -- £80 minimum engagement
  ('beauty',          18.00, 240),   -- £72
  ('fitness',         25.00,  60),   -- PT and gym cover, single hour
  ('pilates_yoga',    35.00,  60),   -- class cover, single class
  ('recovery',        16.00, 240),   -- £64
  ('brand_education', 38.00, 480)    -- training day, £304
) as v(slug, min_hourly_rate, min_shift_minutes)
join public.sectors s on s.slug = v.slug
on conflict (sector_id) do nothing;

-- 7. Access -----------------------------------------------------------------
-- Anyone may read the taxonomy: the public jobs page filters on it. Nothing
-- writes through RLS - doors, sectors and rate cards are edited only through
-- the admin API on the service role, because a rate card decides money.

alter table public.doors enable row level security;
drop policy if exists "Anyone read doors" on public.doors;
create policy "Anyone read doors" on public.doors for select using (true);

alter table public.sectors enable row level security;
drop policy if exists "Anyone read sectors" on public.sectors;
create policy "Anyone read sectors" on public.sectors for select using (true);

alter table public.agency_rate_cards enable row level security;
drop policy if exists "Anyone read agency rate cards" on public.agency_rate_cards;
create policy "Anyone read agency rate cards" on public.agency_rate_cards for select using (true);

-- A professional's sectors are their own to manage, and are visible because a
-- profile is discoverable by sector.
alter table public.candidate_sectors enable row level security;
drop policy if exists "Anyone read candidate sectors" on public.candidate_sectors;
create policy "Anyone read candidate sectors" on public.candidate_sectors for select using (true);
drop policy if exists "Owner manages candidate sectors" on public.candidate_sectors;
create policy "Owner manages candidate sectors" on public.candidate_sectors
  for all to authenticated
  using (exists (
    select 1 from public.candidate_profiles c
    where c.id = candidate_sectors.candidate_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.candidate_profiles c
    where c.id = candidate_sectors.candidate_id and c.user_id = auth.uid()
  ));

-- 8. The public jobs query learns about sectors --------------------------
-- Filtering after the query would break paging: the row count comes from the
-- same statement. Two optional parameters keep every existing caller working
-- - both null behaves exactly as before - while door and sector filters are
-- counted and paged with everything else.

create or replace function public.get_public_jobs_page(
  p_search text default null,
  p_location text default null,
  p_offset integer default 0,
  p_limit integer default 12,
  p_sector_id uuid default null,
  p_door_id uuid default null
)
returns table(
  id uuid,
  job_title text,
  job_description text,
  salary_min integer,
  salary_max integer,
  salary_display_text text,
  job_type text,
  location text,
  tier text,
  posted_date timestamptz,
  employer jsonb,
  total_count bigint
)
language sql
stable
set search_path to 'public'
as $function$
  select
    j.id,
    j.job_title,
    j.job_description,
    j.salary_min,
    j.salary_max,
    j.salary_display_text,
    j.job_type,
    j.location,
    j.tier,
    j.posted_date,
    jsonb_build_object(
      'company_name', coalesce(e.property_name, e.company_name),
      'property_name', e.property_name,
      'property_photos', e.property_photos,
      'tagline', e.tagline,
      'review_score', e.review_score,
      'review_count', e.review_count,
      'star_rating', e.star_rating
    ) as employer,
    count(*) over() as total_count
  from public.job_listings j
  left join public.employer_profiles e on e.id = j.employer_id
  left join public.sectors s on s.id = j.sector_id
  where j.is_live = true
    and (j.expires_at is null or j.expires_at > now())
    and (
      nullif(trim(p_search), '') is null
      or j.job_title ilike '%' || trim(p_search) || '%'
      or coalesce(e.property_name, '') ilike '%' || trim(p_search) || '%'
      or coalesce(e.company_name, '') ilike '%' || trim(p_search) || '%'
    )
    and (
      nullif(trim(p_location), '') is null
      or coalesce(j.location, '') ilike '%' || trim(p_location) || '%'
    )
    and (p_sector_id is null or j.sector_id = p_sector_id)
    and (p_door_id is null or s.door_id = p_door_id)
  order by
    case lower(coalesce(j.tier, ''))
      when 'platinum' then 4
      when 'gold' then 3
      when 'silver' then 2
      when 'bronze' then 1
      else 0
    end desc,
    j.posted_date desc nulls last,
    j.id desc
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$function$;

commit;

notify pgrst, 'reload schema';
