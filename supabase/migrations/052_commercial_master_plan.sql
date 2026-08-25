alter table public.candidate_profiles add column if not exists membership_tier text not null default 'free';
alter table public.candidate_profiles add column if not exists membership_started_at timestamptz;
alter table public.candidate_profiles add column if not exists membership_renews_at timestamptz;
alter table public.candidate_profiles add column if not exists interview_ready_credits integer not null default 1;
alter table public.candidate_profiles add column if not exists academy_discount_pct integer not null default 0;
alter table public.candidate_profiles add column if not exists free_feature_credits integer not null default 0;
alter table public.candidate_profiles add column if not exists membership_stripe_subscription_id text;
alter table public.candidate_profiles add column if not exists membership_stripe_customer_id text;
alter table public.candidate_profiles add column if not exists membership_cancel_at_period_end boolean not null default false;

alter table public.employer_profiles add column if not exists membership_tier text not null default 'free';
alter table public.employer_profiles add column if not exists membership_started_at timestamptz;
alter table public.employer_profiles add column if not exists membership_renews_at timestamptz;
alter table public.employer_profiles add column if not exists annual_job_allowance integer not null default 0;
alter table public.employer_profiles add column if not exists annual_jobs_used integer not null default 0;
alter table public.employer_profiles add column if not exists membership_stripe_subscription_id text;
alter table public.employer_profiles add column if not exists membership_stripe_customer_id text;
alter table public.employer_profiles add column if not exists membership_cancel_at_period_end boolean not null default false;

create table if not exists public.commercial_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_key text not null,
  stripe_session_id text unique,
  stripe_payment_intent text,
  amount_pence integer not null,
  status text not null default 'paid',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists commercial_purchases_user_idx on public.commercial_purchases(user_id,created_at desc);
alter table public.commercial_purchases enable row level security;

insert into public.commercial_settings(product_key,label,description,price_pence,billing_interval,is_active) values
('talent_standard','Talent Standard','1 Interview Ready credit each month, enhanced matching and profile tools, 10% Academy discount.',999,'month',true),
('talent_pro','Talent Pro','10 Interview Ready credits each month, priority visibility, advanced role preparation, 20% Academy discount.',1999,'month',true),
('featured_talent_7','Featured Talent - 7 Days','Seven days of premium visibility in employer searches and featured placements.',999,'one_off',true),
('featured_talent_30','Featured Talent - 30 Days','Thirty days of premium visibility in employer searches and featured placements.',2499,'one_off',true),
('standard_job','Standard Job','30-day permanent job listing with matching, applications and applicant management.',14900,'one_off',true),
('featured_job','Featured Job','30-day featured role with priority placement, relevant talent email and enhanced employer branding.',24900,'one_off',true),
('employer_pro','Employer Pro','Annual employer membership with full talent search, enhanced matching, analytics and discounted standard jobs.',49900,'year',true),
('employer_group','Employer Group','Annual multi-property membership with up to 20 job listings per year.',99900,'year',true),
('employer_pro_standard_job','Employer Pro - Standard Job','Discounted Standard Job for active Employer Pro members.',9900,'one_off',true),
('residency_standard','Standard Residency Listing','Standard Residency opportunity listing.',19900,'one_off',true),
('residency_featured','Featured Residency Listing','Featured Residency opportunity with increased visibility.',29900,'one_off',true),
('brand_spotlight','Brand Spotlight','Dedicated brand exposure across relevant WHC platform surfaces.',29500,'one_off',true),
('industry_feature','Industry Feature','Brand Spotlight plus newsletter and platform feature.',49500,'one_off',true),
('partner_campaign','Partner Campaign','Premium campaign starting package with landing page, email visibility and analytics.',99500,'one_off',true),
('enhanced_employer_profile','Enhanced Employer Profile','Enhanced employer brand page with richer careers content and media.',19900,'year',true),
('recruitment_service_pct','Recruitment Service','WHC managed recruitment service guide rate: 12.5% of first-year salary.',1250,'one_off',true),
('executive_search_pct','Executive Search','Executive search guide rate: 18% midpoint of 15-20% range.',1800,'one_off',true)
on conflict (product_key) do update set label=excluded.label,description=excluded.description,price_pence=excluded.price_pence,billing_interval=excluded.billing_interval,is_active=excluded.is_active;