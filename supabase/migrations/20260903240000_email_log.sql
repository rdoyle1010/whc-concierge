-- A record of every transactional email the platform tries to send.
--
-- "Martin signed up and did not get an email - why?" was unanswerable. The
-- welcome is sent, and a failure was written to console.error inside a Netlify
-- function, which nobody reads and which is gone within days. So there was no
-- way to tell a rejected send from a spam folder from a send that never
-- happened, and every question of this kind ended in a guess.
--
-- Recipients are stored because an audit of what was sent to whom is the point;
-- bodies are not, because nothing here needs them and they age badly.

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  -- What kind of message: welcome_talent, welcome_employer, newsletter_welcome
  -- and so on. Grouped rather than free text so a failing category is obvious.
  kind text not null,
  subject text,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
  -- Why it did not go: the provider's own words, or the reason it was never
  -- attempted (no address, no API key).
  error text,
  provider_id text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_recipient_idx on public.email_log(lower(recipient), created_at desc);
create index if not exists email_log_user_idx on public.email_log(user_id, created_at desc);
create index if not exists email_log_status_idx on public.email_log(status, created_at desc);

alter table public.email_log enable row level security;
-- Read through the service role only. This is an operational record for WHC,
-- not something a member needs, and it names other people's addresses.

analyze public.email_log;
