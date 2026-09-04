-- employer_profiles.contact_email exists in the live database because someone
-- added it by hand, but no migration ever created it. So the column is real in
-- production and absent everywhere else: a rebuild, a restore or a new Supabase
-- project comes up without it.
--
-- What that costs. The Company Profile form sends contact_email on every save.
-- Where the column is missing the save strips it and carries on, so the
-- property types the address they want applications sent to, is told the
-- profile saved, and the value is gone. Notifications then fall back to the
-- account's login address - which for a hotel is often the GM rather than the
-- spa manager who is actually hiring. Nothing errors. The mail just goes to
-- the wrong person.
--
-- Idempotent, so it is safe to run against production where the column is
-- already there.

alter table public.employer_profiles
  add column if not exists contact_email text;

-- Give every property that never filled the field in an address that works.
-- The notification routes already fall back to the login email, so this only
-- makes the stored value match the behaviour rather than changing where
-- anything is sent.
update public.employer_profiles ep
set contact_email = u.email
from auth.users u
where u.id = ep.user_id
  and coalesce(nullif(trim(ep.contact_email), ''), null) is null
  and u.email is not null;

comment on column public.employer_profiles.contact_email is
  'Where this property wants candidate and application email sent. Falls back to the account login address when empty.';
