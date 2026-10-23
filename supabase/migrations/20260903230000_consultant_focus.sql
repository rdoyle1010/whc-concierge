-- What a person came here to do.
--
-- Consultancy was bolted onto the talent account because it was the cheapest
-- route in, and the result is a spa designer signing up and being handed Agency
-- Shifts, Shift Resolution, Before You Arrive, Interview Ready and a profile
-- asking which treatments they perform. None of it applies. They came to list a
-- practice, and everything else is noise telling them they are in the wrong
-- place.
--
-- One column, so the workspace can show them only what they came for. Null
-- means the ordinary talent account and nothing changes for anybody already on
-- the platform.

alter table public.candidate_profiles
  add column if not exists account_focus text
  check (account_focus is null or account_focus in ('consultant'));

comment on column public.candidate_profiles.account_focus is
  'consultant = signed up to list a practice, not to take shifts. Trims the workspace to what they actually use. Null is the ordinary talent account.';

analyze public.candidate_profiles;
