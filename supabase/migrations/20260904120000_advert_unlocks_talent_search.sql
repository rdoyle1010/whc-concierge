-- A paid advert unlocks Discover Talent while it is running.
--
-- A property paid £149 to fill a role and then hit a padlock on the screen
-- that shows who could fill it. They did not buy an advert, they bought a
-- hire, and being locked out of the talent halfway through one is how a
-- customer decides the platform is working against them.
--
-- Deliberately not permanent. Featured Employer used to grant these tools
-- outright and it was taken away for a good reason: one payment bought the
-- same tooling as a Pro subscription, so nobody had any reason to subscribe.
-- This expires with the advert that paid for it, which keeps the subscription
-- worth buying while letting a property actually recruit during the thirty
-- days they have paid for. It also gives them a taste of search, which is the
-- only thing that has ever sold a search subscription.
--
-- Stored on the profile rather than derived from job_listings on every request
-- because three separate gates read this - the page middleware, the API guard
-- and the sidebar - and each one is a hot path. It mirrors featured_until,
-- which already works this way.

alter table public.employer_profiles
  add column if not exists talent_search_until timestamptz;

comment on column public.employer_profiles.talent_search_until is
  'Discover Talent stays unlocked until this moment. Set when a paid advert publishes, to that advert''s expiry. Extended by a later advert, never shortened.';

-- Backfill from adverts that are already live and paid for, so a property that
-- bought one before this shipped is not locked out of what it paid for.
update public.employer_profiles e
set talent_search_until = live.latest_expiry
from (
  select employer_id, max(expires_at) as latest_expiry
  from public.job_listings
  where is_live = true and expires_at is not null and expires_at > now()
  group by employer_id
) live
where live.employer_id = e.id
  and (e.talent_search_until is null or e.talent_search_until < live.latest_expiry);

create index if not exists employer_profiles_talent_search_until_idx
  on public.employer_profiles (talent_search_until)
  where talent_search_until is not null;

analyze public.employer_profiles;
