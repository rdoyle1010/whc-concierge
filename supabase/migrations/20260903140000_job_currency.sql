-- A role pays in the money it actually pays in.
--
-- Every salary on the platform was rendered with a hardcoded pound sign. That
-- was correct while the platform was British and became a liability the moment
-- it was not: a senior therapist role in Hong Kong at HK$45,000 displayed as
-- "£45,000" - out by roughly a factor of ten, in the direction that makes the
-- offer look absurd.
--
-- No conversion is stored anywhere. Rates move, and a converted figure written
-- today is wrong tomorrow. The number a property types is the number a
-- professional sees, with the right symbol in front of it.

alter table public.job_listings
  add column if not exists salary_currency text not null default 'GBP';

-- Every role posted before this was in pounds, and the default above already
-- says so. This is here for rows that somehow carry an empty string rather
-- than the default.
update public.job_listings
  set salary_currency = 'GBP'
  where salary_currency is null or btrim(salary_currency) = '';

comment on column public.job_listings.salary_currency is
  'ISO currency the salary figures are quoted in. Never converted - the number the property typed is the number shown.';

analyze public.job_listings;
