-- Talent House goes international, one product line at a time.
--
-- Roles, Residency and Consultancy are advertising and introduction: the
-- property employs or contracts directly, does its own right-to-work checking
-- and carries its own payroll. Those travel anywhere.
--
-- Agency Cover does not. Placing somebody into a shift makes Talent House an
-- employment business, licensed country by country, so it stays in the UK
-- until a market is deliberately paid for. That rule is enforced in the
-- application rather than here, because it is a commercial decision that will
-- change per country and a CHECK constraint would have to be migrated each
-- time one does.
--
-- Country is stored as an ISO 3166-1 alpha-2 code. The existing free-text
-- columns stay exactly as they are - they hold display text people typed, and
-- rewriting them would lose it - but matching now runs on the code, so 'UK'
-- and 'United Kingdom' stop being two different places.

-- Talent: where they are, and where they will work.
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS open_to_countries text[];

-- Properties: where the property is.
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS country_code text;

-- Roles: where the role is, which is not always where the property is - a
-- group in London hiring for its resort in the Maldives is the ordinary case,
-- not the exception.
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS longitude double precision;

-- Consultancy practices work wherever their clients are, and a consultant in
-- Leeds with three projects in Muscat is normal. Where they are based and
-- where they work are genuinely different answers.
ALTER TABLE consultancy_profiles ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE consultancy_profiles ADD COLUMN IF NOT EXISTS works_in_countries text[];

-- Backfill from what is already there. Every existing row is British: the
-- column default said United Kingdom and the platform took nobody else.
UPDATE candidate_profiles SET country_code = 'GB' WHERE country_code IS NULL;
UPDATE employer_profiles SET country_code = 'GB' WHERE country_code IS NULL;
UPDATE job_listings SET country_code = 'GB' WHERE country_code IS NULL;
UPDATE consultancy_profiles SET country_code = 'GB' WHERE country_code IS NULL;

-- Country is the first filter on every international search, and it is
-- selective enough to be worth an index on its own.
CREATE INDEX IF NOT EXISTS candidate_profiles_country_idx ON candidate_profiles (country_code);
CREATE INDEX IF NOT EXISTS employer_profiles_country_idx ON employer_profiles (country_code);
CREATE INDEX IF NOT EXISTS job_listings_country_live_idx ON job_listings (country_code, is_live);
CREATE INDEX IF NOT EXISTS consultancy_profiles_country_idx ON consultancy_profiles (country_code);

-- "Show me everyone open to working in the UAE" is an array containment
-- query, which needs GIN rather than the btree above.
CREATE INDEX IF NOT EXISTS candidate_profiles_open_countries_idx
  ON candidate_profiles USING gin (open_to_countries);
CREATE INDEX IF NOT EXISTS consultancy_profiles_works_in_idx
  ON consultancy_profiles USING gin (works_in_countries);
