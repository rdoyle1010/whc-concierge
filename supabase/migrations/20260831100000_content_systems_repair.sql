-- Content systems repair: blog visibility, missing advert products,
-- and reproducible tables for fresh environments. All idempotent.

-- 1. Blog: migration 040 dropped the public read policy on blog_posts and
-- never recreated it, so RLS blocked every public read - the Journal showed
-- "coming soon" no matter what was published. Restore it.
drop policy if exists pub_read_published on public.blog_posts;
create policy pub_read_published on public.blog_posts
  for select using (status = 'published');

-- 2. Advertising: three placements had no sellable product row, so their
-- self-serve purchase failed with "not currently available" - including the
-- default selection on /advertise (homepage spotlight).
insert into public.commercial_settings(product_key,label,description,price_pence,billing_interval,is_active) values
('ad_homepage_spotlight','Homepage Spotlight','Featured brand placement on the WHC Concierge homepage.',40000,'month',true),
('ad_academy_sponsor','Academy Sponsor','Sponsor the WHC Academy - education for spa professionals.',25000,'month',true),
('ad_jobs_talent_sponsor','Jobs & Talent Sponsor','Appear across the jobs board and talent job search.',30000,'month',true)
on conflict (product_key) do nothing;

-- 3. Reproducibility: tables the code depends on that earlier migrations
-- only ALTERed. No-ops on the live database.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text,
  status text default 'pending',
  subscribed_at timestamptz default now(),
  requested_at timestamptz default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  confirmation_token_hash text,
  confirmation_expires_at timestamptz,
  consent_policy_version text,
  consent_wording text,
  source text default 'newsletter_popup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  placement text,
  brand_name text,
  tagline text,
  headline text,
  body text,
  cta_label text,
  cta_url text,
  website_url text,
  logo_url text,
  contact_email text,
  status text default 'active',
  review_status text default 'pending',
  payment_status text default 'unpaid',
  source text default 'self_serve',
  monthly_rate integer,
  impression_count integer default 0,
  click_count integer default 0,
  start_date date,
  end_date date,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
