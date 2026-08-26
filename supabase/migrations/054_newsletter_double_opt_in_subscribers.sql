alter table public.newsletter_subscribers add column if not exists email_normalized text;
alter table public.newsletter_subscribers add column if not exists status text;
alter table public.newsletter_subscribers add column if not exists confirmation_token_hash text;
alter table public.newsletter_subscribers add column if not exists confirmation_expires_at timestamptz;
alter table public.newsletter_subscribers add column if not exists requested_at timestamptz;
alter table public.newsletter_subscribers add column if not exists confirmed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists unsubscribed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists consent_policy_version text;
alter table public.newsletter_subscribers add column if not exists consent_wording text;
alter table public.newsletter_subscribers add column if not exists source text;
alter table public.newsletter_subscribers add column if not exists created_at timestamptz;
alter table public.newsletter_subscribers add column if not exists updated_at timestamptz;

update public.newsletter_subscribers set email_normalized=lower(trim(email)) where email_normalized is null;
update public.newsletter_subscribers set status='confirmed' where status is null;
update public.newsletter_subscribers set requested_at=coalesce(subscribed_at,now()) where requested_at is null;
update public.newsletter_subscribers set confirmed_at=coalesce(subscribed_at,now()) where confirmed_at is null;
update public.newsletter_subscribers set consent_policy_version='legacy-import' where consent_policy_version is null;
update public.newsletter_subscribers set consent_wording='Legacy newsletter subscriber migrated into the double opt-in consent model.' where consent_wording is null;
update public.newsletter_subscribers set source='legacy' where source is null;
update public.newsletter_subscribers set created_at=coalesce(subscribed_at,now()) where created_at is null;
update public.newsletter_subscribers set updated_at=now() where updated_at is null;

alter table public.newsletter_subscribers alter column email_normalized set not null;
alter table public.newsletter_subscribers alter column status set default 'pending';
alter table public.newsletter_subscribers alter column status set not null;
alter table public.newsletter_subscribers alter column requested_at set default now();
alter table public.newsletter_subscribers alter column requested_at set not null;
alter table public.newsletter_subscribers alter column consent_policy_version set not null;
alter table public.newsletter_subscribers alter column consent_wording set not null;
alter table public.newsletter_subscribers alter column source set default 'newsletter_popup';
alter table public.newsletter_subscribers alter column source set not null;
alter table public.newsletter_subscribers alter column created_at set default now();
alter table public.newsletter_subscribers alter column created_at set not null;
alter table public.newsletter_subscribers alter column updated_at set default now();
alter table public.newsletter_subscribers alter column updated_at set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='newsletter_subscribers_status_check') then
    alter table public.newsletter_subscribers add constraint newsletter_subscribers_status_check check (status in ('pending','confirmed','unsubscribed'));
  end if;
end $$;

create unique index if not exists newsletter_subscribers_email_normalized_uidx on public.newsletter_subscribers(email_normalized);
create index if not exists newsletter_subscribers_status_idx on public.newsletter_subscribers(status);
create index if not exists newsletter_subscribers_confirmation_hash_idx on public.newsletter_subscribers(confirmation_token_hash);
alter table public.newsletter_subscribers enable row level security;
