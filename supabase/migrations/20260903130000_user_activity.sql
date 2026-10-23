-- Who has actually been using this, and for how long.
--
-- auth.users.last_sign_in_at answers "did they come back", badly: a session
-- lasts weeks, so somebody who signed in once in July and has used the
-- platform every day since still reads as a single sign-in in July. It is the
-- only signal the platform had, and it is the wrong one.
--
-- One row per person per day. The clock is not wall-clock time with the tab
-- open - a laptop left running overnight is not eight hours of engagement, and
-- counting it that way makes the whole number worthless. Instead each five
-- minute bucket in which the person was seen is counted once, so the figure is
-- minutes they were actually doing something.

CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id uuid NOT NULL,
  day date NOT NULL,
  role text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  -- The distinct five-minute buckets seen today, as minute-of-day markers.
  -- An array rather than a counter because a counter cannot tell a second
  -- visit in the same bucket from a new one, and would drift upward every
  -- time a page re-mounted.
  buckets smallint[] NOT NULL DEFAULT '{}',
  page_views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- The admin view is "today, busiest first" and "who has gone quiet", so the
-- day leads the index.
CREATE INDEX IF NOT EXISTS user_activity_day_idx ON public.user_activity (day DESC);
CREATE INDEX IF NOT EXISTS user_activity_user_idx ON public.user_activity (user_id, day DESC);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Nobody reads this through the anon key. The heartbeat writes with the
-- service role and only the admin screens read it, so there is no policy to
-- grant here - and an absent policy on an RLS-enabled table denies everyone,
-- which is the intent rather than an oversight.

-- Recording a heartbeat has to be one statement. Read-modify-write from the
-- application would lose buckets whenever two tabs ping at once, and a person
-- with the dashboard open in two windows is the normal case, not the edge.
CREATE OR REPLACE FUNCTION public.record_activity(
  p_user_id uuid,
  p_role text,
  p_bucket smallint
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.user_activity (user_id, day, role, buckets, page_views)
  VALUES (p_user_id, current_date, p_role, ARRAY[p_bucket], 1)
  ON CONFLICT (user_id, day) DO UPDATE SET
    last_seen_at = now(),
    role = COALESCE(EXCLUDED.role, public.user_activity.role),
    page_views = public.user_activity.page_views + 1,
    buckets = CASE
      WHEN p_bucket = ANY (public.user_activity.buckets) THEN public.user_activity.buckets
      ELSE public.user_activity.buckets || p_bucket
    END;
$$;

REVOKE ALL ON FUNCTION public.record_activity(uuid, text, smallint) FROM public;
