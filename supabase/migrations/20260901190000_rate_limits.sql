-- 20260901190000: A rate limit that survives a cold start.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- The limiter was a module-level Map, which on Netlify Functions means one
-- counter per container: a limit that resets whenever a new container spins
-- up, and that an attacker gets a fresh copy of by arriving on a different
-- instance. It was also applied to only three routes in the entire codebase.
--
-- /api/auth/login had no limit at all. It calls signInWithPassword on the
-- server, so Supabase's own per-IP throttle sees the Netlify function's
-- address rather than the caller's - meaning credential stuffing against the
-- whole user base had no brake and no lockout anywhere in the path.
--
-- /api/newsletter/subscribe had no limit either, and it sends a double
-- opt-in email through Resend to any address given to it. A list of victim
-- addresses turns WHC's own domain into a mail-bombing service and burns the
-- sending reputation every transactional email on the platform depends on.
--
-- Service-role only. Nothing about this table is readable from a browser.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket text NOT NULL,
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits(window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- One atomic increment. Returns the count AFTER this attempt, so the caller
-- refuses when the returned value exceeds the maximum. Doing this in a single
-- statement is what makes it correct under concurrency: two simultaneous
-- attempts cannot both read 4 and both write 5.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket text,
  p_key text,
  p_window_start timestamptz,
  p_max integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  new_count integer;
begin
  insert into public.rate_limits (bucket, key, window_start, count, updated_at)
  values (p_bucket, p_key, p_window_start, 1, now())
  on conflict (bucket, key, window_start)
  do update set count = public.rate_limits.count + 1, updated_at = now()
  returning count into new_count;

  -- Opportunistic cleanup, cheap and bounded: roughly one call in fifty
  -- clears anything older than a day, so the table cannot grow without limit
  -- and no scheduled job is needed to keep it in check.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return new_count;
end;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, timestamptz, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
