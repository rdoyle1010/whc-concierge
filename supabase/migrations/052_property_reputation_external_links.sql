alter table public.employer_profiles add column if not exists tripadvisor_url text;
alter table public.employer_profiles add column if not exists treatment_menu_url text;
alter table public.employer_profiles add column if not exists guest_review_summary text;

comment on column public.employer_profiles.tripadvisor_url is 'Optional employer-supplied TripAdvisor page URL. WHC does not scrape or invent ratings.';
comment on column public.employer_profiles.treatment_menu_url is 'Optional public treatment menu or spa menu URL supplied by the employer.';
comment on column public.employer_profiles.guest_review_summary is 'Optional employer-supplied summary/context about guest reputation. Not a WHC verified score.';
