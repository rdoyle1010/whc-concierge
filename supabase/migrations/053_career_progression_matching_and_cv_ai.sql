alter table public.job_listings add column if not exists candidate_scope text not null default 'step_up' check (candidate_scope in ('same_level','step_up','emerging','open_transferable'));
alter table public.candidate_profiles add column if not exists business_skills text[];
alter table public.candidate_profiles add column if not exists career_evidence text[];
comment on column public.job_listings.candidate_scope is 'Employer-defined matching openness: same level, one-level step-up, emerging talent up to two levels below, or open transferable experience.';
comment on column public.candidate_profiles.business_skills is 'Candidate-approved business and leadership capabilities, including skills suggested by AI CV analysis.';
comment on column public.candidate_profiles.career_evidence is 'Candidate-approved short evidence statements extracted from their CV; never raw CV text.';