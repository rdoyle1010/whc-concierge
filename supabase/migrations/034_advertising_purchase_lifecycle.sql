alter table public.ad_placements
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists live_email_sent_at timestamptz,
  add column if not exists rejected_email_sent_at timestamptz;

comment on column public.ad_placements.terms_version is 'Version of the advertising terms accepted before Stripe checkout.';
comment on column public.ad_placements.terms_accepted_at is 'Timestamp recorded from checkout metadata when advertising terms were accepted.';
