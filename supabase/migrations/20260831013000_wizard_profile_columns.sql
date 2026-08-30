-- Skills Wizard rewiring (31 Aug 2026): proficiency map and hotel-group
-- experience live on the profile, matching everything else the matching
-- engine reads. Additive, idempotent.
alter table public.candidate_profiles add column if not exists skill_proficiencies jsonb not null default '{}'::jsonb;
alter table public.candidate_profiles add column if not exists hotel_brands_worked text[];
notify pgrst, 'reload schema';
