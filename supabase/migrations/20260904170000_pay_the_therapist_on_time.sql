-- 20260904170000: A professional's wages stop waiting on somebody else's admin.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- enforce_agency_review_before_payout refused to release a payout until BOTH
-- sides had left a review:
--
--   if new.candidate_review_completed_at is null
--      or new.employer_review_completed_at is null then
--     raise exception 'Agency payout cannot be released until both reviews are
--                      complete';
--
-- The intent is sound. Reviews are the trust engine of the register, and
-- nobody books an unrated stranger into a five-star spa.
--
-- The effect is not. The therapist does the shift. The property is happy. The
-- property never gets round to reviewing, because they are busy, because the
-- manager who booked it has left, because it is Tuesday. The therapist's money
-- is then frozen indefinitely by a third party's inaction, with nothing on any
-- screen explaining why. They are self-employed. That is somebody's rent,
-- withheld for an admin task that was never theirs to complete.
--
-- THE RULE NOW
--
-- The professional's own review is required, because they are the one being
-- paid, it costs them a minute, and their account of the shift is the half
-- that protects the next property.
--
-- The property's review is chased, never demanded. It has no power to hold
-- anybody's wages.
--
-- And after seven days from the shift, nothing is required at all. A review
-- worth having is one given within a week; after that it is a memory, and it
-- is certainly not worth a fortnight of somebody's income.
--
-- Reminders are sent by /api/agency/review-reminders on a nightly schedule.
-- This function stays deliberately ignorant of them: the database decides who
-- may be paid, and the application decides who gets nudged.

CREATE OR REPLACE FUNCTION public.enforce_agency_review_before_payout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  shift_over timestamptz;
BEGIN
  IF new.payout_status <> 'paid' OR coalesce(old.payout_status, '') = 'paid' THEN
    RETURN new;
  END IF;

  -- Seven days from the shift itself, falling back to when the property paid
  -- and then to when the booking was made, so a row missing a date can never
  -- strand a payout for ever.
  shift_over := coalesce(new.shift_date::timestamptz, new.paid_at, new.created_at);

  IF shift_over IS NOT NULL AND shift_over <= now() - interval '7 days' THEN
    RETURN new;
  END IF;

  IF new.candidate_review_completed_at IS NULL THEN
    RAISE EXCEPTION 'This payout needs the professional''s review of the shift, or seven days from the shift date - whichever comes first. The property''s review is not required.';
  END IF;

  RETURN new;
END;
$function$;

-- payout_ready_at has to agree with the rule above, or a booking that may
-- lawfully be paid still reads as not ready.
CREATE OR REPLACE FUNCTION public.refresh_agency_review_gate(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_booking record;
  v_candidate_user uuid;
  v_employer_user uuid;
  v_candidate_done timestamptz;
  v_employer_done timestamptz;
  v_shift_over timestamptz;
  v_releasable boolean;
BEGIN
  SELECT id, candidate_id, employer_id, paid_at, payout_status, dispute_status, shift_date, created_at, payout_ready_at
    INTO v_booking
  FROM public.agency_bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT user_id INTO v_candidate_user FROM public.candidate_profiles WHERE id = v_booking.candidate_id;
  SELECT user_id INTO v_employer_user FROM public.employer_profiles WHERE id = v_booking.employer_id;

  SELECT max(created_at) INTO v_candidate_done
  FROM public.reviews
  WHERE booking_id = p_booking_id AND reviewer_id = v_candidate_user;

  SELECT max(created_at) INTO v_employer_done
  FROM public.reviews
  WHERE booking_id = p_booking_id AND reviewer_id = v_employer_user;

  v_shift_over := coalesce(v_booking.shift_date::timestamptz, v_booking.paid_at, v_booking.created_at);

  v_releasable :=
    v_booking.paid_at IS NOT NULL
    AND coalesce(v_booking.dispute_status, '') <> 'open'
    AND (
      v_candidate_done IS NOT NULL
      OR (v_shift_over IS NOT NULL AND v_shift_over <= now() - interval '7 days')
    );

  UPDATE public.agency_bookings
  SET candidate_review_completed_at = v_candidate_done,
      employer_review_completed_at = v_employer_done,
      payout_ready_at = CASE WHEN v_releasable THEN coalesce(payout_ready_at, now()) ELSE NULL END
  WHERE id = p_booking_id;
END;
$function$;

-- The same agreement, on the path that runs when a review is first written.
CREATE OR REPLACE FUNCTION public.mark_agency_booking_review_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  b public.agency_bookings%rowtype;
  emp_user uuid;
  cand_user uuid;
BEGIN
  IF new.booking_id IS NULL THEN RETURN new; END IF;
  SELECT * INTO b FROM public.agency_bookings WHERE id = new.booking_id;
  IF NOT FOUND THEN RETURN new; END IF;
  SELECT user_id INTO emp_user FROM public.employer_profiles WHERE id = b.employer_id;
  SELECT user_id INTO cand_user FROM public.candidate_profiles WHERE id = b.candidate_id;

  IF new.reviewer_id = emp_user THEN
    UPDATE public.agency_bookings
      SET employer_review_completed_at = coalesce(employer_review_completed_at, now())
      WHERE id = b.id;
  ELSIF new.reviewer_id = cand_user THEN
    UPDATE public.agency_bookings
      SET candidate_review_completed_at = coalesce(candidate_review_completed_at, now())
      WHERE id = b.id;
  END IF;

  -- Delegated rather than duplicated: one place decides what "ready" means.
  PERFORM public.refresh_agency_review_gate(b.id);
  RETURN new;
END;
$function$;

-- When the last reminder went out, so the nightly sweep nudges rather than
-- nags. Nothing reads it but the reminder route.
ALTER TABLE public.agency_bookings
  ADD COLUMN IF NOT EXISTS review_reminder_last_at timestamptz;

-- Bookings already stranded behind a property that never reviewed are released
-- by the same rule the moment it applies, rather than waiting for somebody to
-- notice them.
UPDATE public.agency_bookings
SET payout_ready_at = coalesce(payout_ready_at, now())
WHERE paid_at IS NOT NULL
  AND coalesce(dispute_status, '') <> 'open'
  AND coalesce(payout_status, '') <> 'paid'
  AND (
    candidate_review_completed_at IS NOT NULL
    OR coalesce(shift_date::timestamptz, paid_at, created_at) <= now() - interval '7 days'
  );

NOTIFY pgrst, 'reload schema';
