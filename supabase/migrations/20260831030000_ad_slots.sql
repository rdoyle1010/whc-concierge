-- Site-wide ad slot system (31 Aug 2026). Slots are hidden by default and
-- admin switches each on when there is an advert worth showing. Additive
-- and idempotent - safe to run twice.

create table if not exists public.ad_slot_settings (
  slot_key text primary key,
  enabled boolean not null default false,
  pinned_placement_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.ad_slot_settings enable row level security;
revoke all on table public.ad_slot_settings from anon, authenticated;
grant all on table public.ad_slot_settings to service_role;

-- The three original slots stay live; every new slot starts hidden.
insert into public.ad_slot_settings (slot_key, enabled) values
('homepage_spotlight', true), ('academy_sponsor', true), ('jobs_talent_sponsor', true),
('job_detail_sponsor', false), ('journal_sponsor', false), ('journal_article_sponsor', false),
('talent_dashboard_sponsor', false), ('employer_dashboard_sponsor', false),
('agency_page_sponsor', false), ('residency_page_sponsor', false)
on conflict (slot_key) do nothing;

-- Direct (admin-placed) adverts: a brand that emails WHC can be placed
-- without the self-serve Stripe flow.
alter table public.ad_placements add column if not exists source text not null default 'self_serve';

-- Sellable products for the new placements (prices editable in admin settings).
insert into public.commercial_settings(product_key,label,description,price_pence,billing_interval,is_active) values
('ad_job_detail_sponsor','Job Page Sponsor','Appear on individual job listings as candidates read the role.',25000,'month',true),
('ad_journal_sponsor','Journal Sponsor','Sponsor the WHC Journal - industry reading for spa professionals and leaders.',20000,'month',true),
('ad_journal_article_sponsor','Journal Article Sponsor','Appear within Journal articles as they are read.',15000,'month',true),
('ad_talent_dashboard_sponsor','Talent Dashboard Sponsor','Reach signed-in spa professionals inside their WHC dashboard.',25000,'month',true),
('ad_employer_dashboard_sponsor','Employer Dashboard Sponsor','Reach spa and hotel employers inside their recruitment dashboard.',20000,'month',true),
('ad_agency_page_sponsor','Agency Sponsor','Appear on the WHC flexible-work and agency pages.',15000,'month',true),
('ad_residency_page_sponsor','Residency Sponsor','Appear alongside international residency opportunities.',15000,'month',true)
on conflict (product_key) do update set label=excluded.label,description=excluded.description;

notify pgrst, 'reload schema';
