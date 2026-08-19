alter table public.application_interviews
  add column if not exists meeting_link text,
  add column if not exists venue_address text,
  add column if not exists contact_name text,
  add column if not exists preparation_required text,
  add column if not exists assessment_type text,
  add column if not exists assessment_details text;
