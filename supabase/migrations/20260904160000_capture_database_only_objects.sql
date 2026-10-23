-- 20260904160000: Everything that was living only in the production database.
--
-- Additive and idempotent. CHANGES NO BEHAVIOUR. Every definition below is a
-- verbatim copy of what production already runs, so applying this to the live
-- database is a no-op; applying it to a rebuilt one makes that database behave
-- the same.
--
-- WHY
--
-- An afternoon went on "The property must set an Agency search radius before
-- sending or accepting a shift" - a message that refused every Agency booking
-- on the platform and appeared in no file in this repository. It came from a
-- trigger written straight into the SQL editor. Every search of the codebase
-- came back clean, every test passed, every deploy published, and the platform
-- was still broken. There was nowhere left to look because the rule was not
-- anywhere a person would think to look.
--
-- A sweep of the live database against this folder then found twenty-four more
-- objects in the same position: fourteen functions and ten triggers existing in
-- production and nowhere else. Six of the functions and all ten triggers are
-- load bearing. If this database were ever rebuilt from the repository, the
-- messages inbox would stop working, agency payouts would stop being gated,
-- mutual matches would stop being created, and five tables would stop stamping
-- updated_at - and nothing in the code would explain any of it.
--
-- Four are dead. They are written down as dead rather than deleted, because a
-- record that something exists and does nothing is worth more than a silence
-- somebody rediscovers in a year.

-- ---------------------------------------------------------------------------
-- Messaging. The conversations inbox calls this directly through .rpc().
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_message_conversation_summaries(p_user_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(partner_id uuid, last_message_id uuid, last_sender_id uuid, last_recipient_id uuid, last_content text, last_attachment_name text, last_created_at timestamp with time zone, unread_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with relevant as (
    select
      m.id,
      m.sender_id,
      m.recipient_id,
      m.content,
      m.attachment_name,
      m.created_at,
      m.read,
      case when m.sender_id = p_user_id then m.recipient_id else m.sender_id end as partner_id
    from public.messages m
    where m.sender_id = p_user_id or m.recipient_id = p_user_id
  ), ranked as (
    select
      r.*,
      row_number() over (partition by r.partner_id order by r.created_at desc, r.id desc) as rn,
      count(*) filter (where r.recipient_id = p_user_id and coalesce(r.read, false) = false)
        over (partition by r.partner_id) as unread_count
    from relevant r
    where r.partner_id is not null
  )
  select
    partner_id,
    id as last_message_id,
    sender_id as last_sender_id,
    recipient_id as last_recipient_id,
    content as last_content,
    attachment_name as last_attachment_name,
    created_at as last_created_at,
    unread_count
  from ranked
  where rn = 1
  order by last_created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$function$;

-- ---------------------------------------------------------------------------
-- The maintenance lock. Migration 040 revokes execute on this function without
-- ever creating it, which is how a REVOKE ended up guarding something that
-- existed only by luck.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_maintenance_job(p_job_key text, p_min_interval_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  did_claim boolean := false;
begin
  insert into public.maintenance_claims(job_key, claimed_at)
  values (p_job_key, now())
  on conflict (job_key) do update
    set claimed_at = excluded.claimed_at
    where public.maintenance_claims.claimed_at <= now() - make_interval(secs => greatest(p_min_interval_seconds, 1))
  returning true into did_claim;

  return coalesce(did_claim, false);
end;
$function$;

-- ---------------------------------------------------------------------------
-- The Agency review gate. Three functions and three triggers that together
-- decide whether a self-employed professional gets paid.
--
-- Recorded here exactly as it runs today. Whether a therapist's wages should
-- wait on a property remembering to leave a review is a commercial decision,
-- and it belongs in its own migration rather than being changed by a tidy-up.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_agency_review_before_payout()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.payout_status = 'paid' and coalesce(old.payout_status,'') <> 'paid' then
    if new.candidate_review_completed_at is null or new.employer_review_completed_at is null then
      raise exception 'Agency payout cannot be released until both reviews are complete';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_agency_review_gate(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_booking record;
  v_candidate_user uuid;
  v_employer_user uuid;
  v_candidate_done timestamptz;
  v_employer_done timestamptz;
begin
  select id, candidate_id, employer_id, paid_at, payout_status, dispute_status
    into v_booking
  from public.agency_bookings
  where id = p_booking_id;

  if not found then return; end if;

  select user_id into v_candidate_user from public.candidate_profiles where id = v_booking.candidate_id;
  select user_id into v_employer_user from public.employer_profiles where id = v_booking.employer_id;

  select max(created_at) into v_candidate_done
  from public.reviews
  where booking_id = p_booking_id and reviewer_id = v_candidate_user;

  select max(created_at) into v_employer_done
  from public.reviews
  where booking_id = p_booking_id and reviewer_id = v_employer_user;

  update public.agency_bookings
  set candidate_review_completed_at = v_candidate_done,
      employer_review_completed_at = v_employer_done,
      payout_ready_at = case
        when v_candidate_done is not null and v_employer_done is not null
             and paid_at is not null
             and coalesce(dispute_status,'') <> 'open'
        then coalesce(payout_ready_at, now())
        else null
      end
  where id = p_booking_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_refresh_agency_review_gate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.booking_id is not null then
    perform public.refresh_agency_review_gate(new.booking_id);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.mark_agency_booking_review_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  b public.agency_bookings%rowtype;
  emp_user uuid;
  cand_user uuid;
begin
  if new.booking_id is null then return new; end if;
  select * into b from public.agency_bookings where id = new.booking_id;
  if not found then return new; end if;
  select user_id into emp_user from public.employer_profiles where id = b.employer_id;
  select user_id into cand_user from public.candidate_profiles where id = b.candidate_id;

  if new.reviewer_id = emp_user then
    update public.agency_bookings
      set employer_review_completed_at = coalesce(employer_review_completed_at, now())
      where id = b.id;
  elsif new.reviewer_id = cand_user then
    update public.agency_bookings
      set candidate_review_completed_at = coalesce(candidate_review_completed_at, now())
      where id = b.id;
  end if;

  update public.agency_bookings
    set payout_ready_at = case
      when employer_review_completed_at is not null and candidate_review_completed_at is not null then coalesce(payout_ready_at, now())
      else payout_ready_at end
    where id = b.id;
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Mutual match on swipes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_mutual_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  other_swipe record;
  calc_match_score integer;
BEGIN
  -- Only check on right swipes
  IF NEW.action != 'right' THEN
    RETURN NEW;
  END IF;

  -- If candidate swiped right on a job, check if employer swiped right on candidate
  IF NEW.swiper_type = 'candidate' THEN
    SELECT * INTO other_swipe FROM swipes
    WHERE swiper_type = 'employer'
      AND target_id = NEW.swiper_id   -- employer swiped on this candidate
      AND target_type = 'candidate'
      AND action = 'right'
      AND swiper_id = (SELECT employer_id FROM job_listings WHERE id = NEW.target_id)
    LIMIT 1;

    IF FOUND THEN
      -- Calculate a basic match score (can be enhanced later)
      calc_match_score := 70 + floor(random() * 25);  -- 70-95 for now

      INSERT INTO matches (candidate_id, employer_id, job_listing_id, match_score, candidate_swiped_at, employer_swiped_at)
      VALUES (NEW.swiper_id, other_swipe.swiper_id, NEW.target_id, calc_match_score, NEW.swiped_at, other_swipe.swiped_at)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- If employer swiped right on a candidate, check if candidate swiped right on any of employer's jobs
  IF NEW.swiper_type = 'employer' THEN
    SELECT s.* INTO other_swipe FROM swipes s
    JOIN job_listings jl ON jl.id = s.target_id
    WHERE s.swiper_type = 'candidate'
      AND s.swiper_id = NEW.target_id  -- this candidate swiped
      AND s.action = 'right'
      AND jl.employer_id = NEW.swiper_id  -- on one of this employer's jobs
    LIMIT 1;

    IF FOUND THEN
      calc_match_score := 70 + floor(random() * 25);

      INSERT INTO matches (candidate_id, employer_id, job_listing_id, match_score, employer_swiped_at, candidate_swiped_at)
      VALUES (NEW.target_id, NEW.swiper_id, other_swipe.target_id, calc_match_score, NEW.swiped_at, other_swipe.swiped_at)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- The timestamp setter behind five tables.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Dead, and recorded as dead.
--
--   handle_new_candidate       fires on profiles.role = 'candidate'. This
--                              platform stores 'talent', so it has almost
--                              certainly never run. Its trigger is recorded
--                              below all the same, because a trigger that
--                              exists and does nothing should be visible.
--   update_ratings_on_review   writes overall_rating and total_reviews, while
--                              the reviews API maintains review_score and
--                              review_count. Superseded, and no trigger calls
--                              it.
--   increment_role_views       nothing calls it.
--   update_thread_last_message nothing calls it and no trigger runs it.
--   get_academy_revenue_summary
--   get_candidate_application_status_counts
--                              read-only helpers the application does not use.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_candidate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'candidate' THEN
    INSERT INTO candidate_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ratings_on_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update employer rating when candidate reviews them
  IF NEW.review_direction = 'candidate_to_employer' AND NEW.subject_employer_id IS NOT NULL THEN
    UPDATE employer_profiles SET
      overall_rating = (SELECT AVG(rating_overall) FROM reviews WHERE subject_employer_id = NEW.subject_employer_id AND is_verified = true),
      total_reviews = (SELECT COUNT(*) FROM reviews WHERE subject_employer_id = NEW.subject_employer_id AND is_verified = true)
    WHERE id = NEW.subject_employer_id;
  END IF;

  -- Update candidate rating when employer reviews them
  IF NEW.review_direction = 'employer_to_candidate' AND NEW.subject_candidate_id IS NOT NULL THEN
    UPDATE candidate_profiles SET
      overall_rating = (SELECT AVG(rating_overall) FROM reviews WHERE subject_candidate_id = NEW.subject_candidate_id AND is_verified = true),
      total_reviews = (SELECT COUNT(*) FROM reviews WHERE subject_candidate_id = NEW.subject_candidate_id AND is_verified = true)
    WHERE id = NEW.subject_candidate_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_role_views(role_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE roles SET views = views + 1 WHERE id = role_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_thread_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE message_threads
  SET last_message = NEW.content, last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_academy_revenue_summary()
 RETURNS TABLE(revenue bigint, enrolments bigint, completions bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    coalesce(sum(amount_paid), 0)::bigint as revenue,
    count(*)::bigint as enrolments,
    count(completed_at)::bigint as completions
  from public.course_enrollments
  where paid_at is not null;
$function$;

CREATE OR REPLACE FUNCTION public.get_candidate_application_status_counts(p_candidate_id uuid)
 RETURNS TABLE(status text, total bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select a.status, count(*)::bigint
  from public.applications a
  where a.candidate_id = p_candidate_id
  group by a.status;
$function$;

-- ---------------------------------------------------------------------------
-- The ten triggers. Each is guarded on its table existing, so a partial
-- rebuild does not fail on a table it has not created yet.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  spec record;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('agency_bookings',   'agency_review_gate_before_payout',      'BEFORE UPDATE OF payout_status', 'enforce_agency_review_before_payout'),
      ('applications',      'update_applications_timestamp',         'BEFORE UPDATE',                  'update_updated_at'),
      ('candidate_profiles','update_candidate_profiles_timestamp',   'BEFORE UPDATE',                  'update_updated_at'),
      ('profiles',          'update_profiles_timestamp',             'BEFORE UPDATE',                  'update_updated_at'),
      ('property_profiles', 'update_property_profiles_timestamp',    'BEFORE UPDATE',                  'update_updated_at'),
      ('roles',             'update_roles_timestamp',                'BEFORE UPDATE',                  'update_updated_at'),
      ('profiles',          'on_candidate_profile_created',          'AFTER INSERT',                   'handle_new_candidate'),
      ('reviews',           'reviews_mark_agency_complete',          'AFTER INSERT',                   'mark_agency_booking_review_complete'),
      ('reviews',           'reviews_refresh_agency_gate',           'AFTER INSERT OR UPDATE',         'trg_refresh_agency_review_gate'),
      ('swipes',            'trigger_check_mutual_match',            'AFTER INSERT',                   'check_mutual_match')
    ) AS t(table_name, trigger_name, timing, fn)
  LOOP
    IF to_regclass('public.' || spec.table_name) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', spec.trigger_name, spec.table_name);
      EXECUTE format(
        'CREATE TRIGGER %I %s ON public.%I FOR EACH ROW EXECUTE FUNCTION public.%I()',
        spec.trigger_name, spec.timing, spec.table_name, spec.fn
      );
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
