-- Checkpoint 13: editable Academy catalogue and paid sponsored placements.
-- This migration is additive. Existing enrolments, certificates, website
-- content and legacy image rows are deliberately preserved.

create table if not exists public.academy_courses (
  slug text primary key,
  title text not null,
  tagline text not null default '',
  category text not null,
  minutes integer not null default 30 check (minutes between 1 and 600),
  price integer not null default 1000 check (price between 0 and 1000000),
  image_url text,
  lessons jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  answer_key jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_core boolean not null default false,
  is_custom boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_courses enable row level security;
revoke all on table public.academy_courses from anon, authenticated;
grant select, insert, update, delete on table public.academy_courses to service_role;

alter table public.ad_placements
  add column if not exists contact_email text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists review_status text not null default 'draft',
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ad_placements_checkout_session_uidx
  on public.ad_placements (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists ad_placements_public_lookup_idx
  on public.ad_placements (placement, status, payment_status, review_status, start_date, end_date);
create index if not exists ad_placements_subscription_idx
  on public.ad_placements (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.ad_placements enable row level security;
revoke all on table public.ad_placements from anon, authenticated;
grant select, insert, update, delete on table public.ad_placements to service_role;

comment on table public.academy_courses is
  'Admin-managed Academy course overrides and custom courses. Quiz answers remain server-only.';
comment on column public.ad_placements.review_status is
  'draft, pending, approved, rejected or archived; public adverts require approved plus paid.';

