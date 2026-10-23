-- One record of everything the platform sends a person, whatever it was sent by.
--
-- The log was built for email during a "why did Martin not get his welcome?"
-- and only ever covered email. Texts went nowhere at all: a failed SMS printed
-- to a serverless console and was gone within days, so "did they get the
-- interview text?" had no answer.
--
-- Same table, one more column. Two logs for two channels would mean checking
-- two places to answer one question.

alter table public.email_log
  add column if not exists channel text not null default 'email'
  check (channel in ('email', 'sms'));

-- Recipients are addresses or numbers depending on the channel, so the index
-- that finds "everything we sent this person" needs both.
create index if not exists email_log_channel_idx on public.email_log(channel, created_at desc);

comment on column public.email_log.channel is
  'email or sms. One table, because "what have we sent this person" is one question.';

analyze public.email_log;
