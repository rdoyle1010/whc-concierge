create table if not exists public.privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_email_status text not null default 'never' check (marketing_email_status in ('never','pending','confirmed','unsubscribed')),
  marketing_email_requested_at timestamptz,
  marketing_email_confirmed_at timestamptz,
  marketing_email_revoked_at timestamptz,
  marketing_sms boolean not null default false,
  marketing_phone boolean not null default false,
  job_alerts_email boolean not null default true,
  application_updates_email boolean not null default true,
  booking_updates_email boolean not null default true,
  academy_updates_email boolean not null default false,
  product_news_email boolean not null default false,
  partner_marketing_email boolean not null default false,
  share_profile_with_employers boolean not null default true,
  share_profile_with_whc_partners boolean not null default false,
  allow_anonymised_research boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  action text not null check (action in ('requested','confirmed','withdrawn','enabled','disabled','accepted','declined')),
  policy_version text not null,
  wording text,
  source text not null default 'account_preferences',
  created_at timestamptz not null default now()
);
create index if not exists consent_events_user_created_idx on public.consent_events(user_id, created_at desc);

create table if not exists public.marketing_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists marketing_confirmation_tokens_user_idx on public.marketing_confirmation_tokens(user_id, created_at desc);

alter table public.privacy_preferences enable row level security;
alter table public.consent_events enable row level security;
alter table public.marketing_confirmation_tokens enable row level security;

drop policy if exists "privacy_preferences_own_select" on public.privacy_preferences;
create policy "privacy_preferences_own_select" on public.privacy_preferences for select to authenticated using (auth.uid() = user_id);
drop policy if exists "privacy_preferences_own_update" on public.privacy_preferences;
create policy "privacy_preferences_own_update" on public.privacy_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "privacy_preferences_own_insert" on public.privacy_preferences;
create policy "privacy_preferences_own_insert" on public.privacy_preferences for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "consent_events_own_select" on public.consent_events;
create policy "consent_events_own_select" on public.consent_events for select to authenticated using (auth.uid() = user_id);
