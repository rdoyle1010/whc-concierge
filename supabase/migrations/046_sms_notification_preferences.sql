alter table public.candidate_profiles
  add column if not exists sms_opt_in boolean not null default false;

alter table public.employer_profiles
  add column if not exists sms_opt_in boolean not null default false;
