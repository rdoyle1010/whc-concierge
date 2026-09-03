-- An edit to a live listing no longer takes it offline.
--
-- Editing an approved listing used to set it back to pending, which pulled it
-- from the public directory until somebody re-read it. Correcting a typo cost a
-- consultant their place in the directory, and the lesson they learn from that
-- is to stop editing.
--
-- The listing stays live and is flagged for a re-read instead. Moderation is
-- unchanged - anything wrong can still be pulled by hand, immediately.

alter table public.consultancy_profiles
  add column if not exists review_requested_at timestamptz;

comment on column public.consultancy_profiles.review_requested_at is
  'Set when a live listing is edited. The listing stays public; this marks it for a re-read rather than punishing the edit.';

analyze public.consultancy_profiles;
