-- Archiving a request you have finished with.
--
-- The queue shows everything ever sent, newest first, which is right for the
-- first week and useless by the second: the three people waiting on her sit
-- underneath a fortnight of people she has already dealt with. A status of
-- "Theirs now" says what happened to a request. It does not say she is
-- finished looking at it, and those are different things - a declined one is
-- finished too, and a sent one may still be waiting on a reply.
--
-- So: one timestamp, set when she archives and cleared when she puts it back.
-- Nothing is deleted by archiving, and the row is one toggle away.

alter table public.profile_build_requests
  add column if not exists archived_at timestamptz;

create index if not exists profile_build_requests_open_idx
  on public.profile_build_requests(created_at desc)
  where archived_at is null;

comment on column public.profile_build_requests.archived_at is
  'When she finished with this request. Hidden from the queue while set. Not a deletion.';
