-- The questions a CV cannot answer.
--
-- A built profile kept stopping at eighty per cent with "About you, Postcode"
-- underneath it, because a CV is a record of what somebody has done and says
-- nothing about when they could start, how far they would travel, what
-- languages they hold, or how much of themselves they want a hotel to see.
--
-- So the intake asks eight things, five of them one tap, and the answers are
-- written onto the profile the moment the account is made. By the time the
-- request reaches the queue it is already part filled in, and what the CV
-- adds finishes it rather than starting it.
--
-- One jsonb column rather than eight typed ones, deliberately. Adding a
-- question should not need a migration, and this platform has been bitten
-- three times by a statement naming a column that does not exist: Postgres
-- refuses the whole write, so one wrong name loses every field beside it.

alter table public.profile_build_requests
  add column if not exists answers jsonb not null default '{}'::jsonb;

comment on column public.profile_build_requests.answers is
  'What they answered at intake. Keys are defined in src/lib/profile-build-questions.ts and nothing else is stored.';
