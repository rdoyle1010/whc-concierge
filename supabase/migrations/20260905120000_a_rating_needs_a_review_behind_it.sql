-- 20260905120000: a public star rating must have a review behind it.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- An external review of the live site found this, and it is the worst kind of
-- defect on a trust platform:
--
--   /testimonials   "No reviews have met the standard yet"
--   /properties     "5.0 Talent House verified (1)"
--
-- Both are generated from the database. The testimonials page counts rows in
-- public.reviews. The directory reads employer_profiles.review_score and
-- .review_count, which are stored numbers written by the reviews API when a
-- review is submitted - and never recomputed by anything afterwards.
--
-- 20260904160000 recorded that update_ratings_on_review is superseded and no
-- trigger calls it. So nothing at all has been keeping these two columns
-- honest. A value put there by seeding, by a hand edit, or by a review that
-- was later deleted stays on the public directory for ever, as a star rating
-- with nothing behind it.
--
-- A fabricated rating on a page selling verified reviews is not a display
-- bug. It is the product failing at the exact thing it claims to do.
--
-- THE RULE
--
-- review_score and review_count are derived, not entered. They are recomputed
-- from public.reviews whenever a review is written, changed or deleted, and
-- backfilled below for every profile - including the ones whose true answer
-- is nothing, which is how the phantom rating goes away.

CREATE OR REPLACE FUNCTION public.refresh_review_counters(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_count integer;
  v_score numeric;
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;

  SELECT count(*), round(avg(rating)::numeric, 1)
    INTO v_count, v_score
  FROM public.reviews
  WHERE reviewee_id = p_user
    AND rating IS NOT NULL;

  -- No reviews means no score. Nought rather than NULL keeps every reader's
  -- "> 0" test working the same way.
  IF v_count = 0 THEN v_score := 0; END IF;

  UPDATE public.candidate_profiles
     SET review_count = v_count, review_score = v_score
   WHERE user_id = p_user
     AND (coalesce(review_count, -1) IS DISTINCT FROM v_count
       OR coalesce(review_score, -1) IS DISTINCT FROM v_score);

  UPDATE public.employer_profiles
     SET review_count = v_count, review_score = v_score
   WHERE user_id = p_user
     AND (coalesce(review_count, -1) IS DISTINCT FROM v_count
       OR coalesce(review_score, -1) IS DISTINCT FROM v_score);
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_review_counters(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_refresh_review_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_review_counters(old.reviewee_id);
    RETURN old;
  END IF;

  PERFORM public.refresh_review_counters(new.reviewee_id);
  -- A review moved from one person to another leaves the first one wrong.
  IF TG_OP = 'UPDATE' AND old.reviewee_id IS DISTINCT FROM new.reviewee_id THEN
    PERFORM public.refresh_review_counters(old.reviewee_id);
  END IF;
  RETURN new;
END;
$function$;

DO $$
BEGIN
  IF to_regclass('public.reviews') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS reviews_refresh_counters ON public.reviews;
    CREATE TRIGGER reviews_refresh_counters
      AFTER INSERT OR UPDATE OR DELETE ON public.reviews
      FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_review_counters();
  END IF;
END $$;

-- The backfill. Every profile, not only the ones with reviews: a rating with
-- no review behind it is exactly what this exists to remove, and those rows
-- are invisible to a query that starts from the reviews table.
DO $$
DECLARE
  v_user uuid;
BEGIN
  IF to_regclass('public.reviews') IS NULL THEN RETURN; END IF;

  IF to_regclass('public.candidate_profiles') IS NOT NULL THEN
    FOR v_user IN SELECT user_id FROM public.candidate_profiles WHERE user_id IS NOT NULL LOOP
      PERFORM public.refresh_review_counters(v_user);
    END LOOP;
  END IF;

  IF to_regclass('public.employer_profiles') IS NOT NULL THEN
    FOR v_user IN SELECT user_id FROM public.employer_profiles WHERE user_id IS NOT NULL LOOP
      PERFORM public.refresh_review_counters(v_user);
    END LOOP;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
