-- 20260904150000: A property's browsing preference stops blocking bookings it
-- has deliberately chosen to make.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- public.enforce_mutual_agency_radius() fires BEFORE INSERT OR UPDATE on
-- agency_bookings. It was written straight into the database and existed in no
-- migration, so it appeared in no search of this repository - which is how a
-- rule that refused every offer on the platform stayed invisible for an
-- afternoon while the code, the tests and the deploys all read clean.
--
-- Its first check was:
--
--   if e_radius is null or e_radius <= 0 then
--     raise exception 'The property must set an Agency search radius before
--                      sending or accepting a shift.';
--
-- agency_search_radius_miles is a SEARCH preference. It is written only when a
-- property runs a distance search, and a UK-wide search deliberately writes
-- nothing. A property is never asked for one when it signs up. So a property
-- that had only ever browsed UK-wide had a null there, and every offer it sent
-- was refused by a message naming a field it had never been asked to fill in.
--
-- The second employer check was wrong for the same reason in a subtler way:
-- refusing a booking because the professional sits outside the radius the
-- property last searched with. The property has looked at this person, read
-- their profile and chosen to offer them a shift. A stale browsing filter is
-- not a reason to overrule that.
--
-- WHAT IS KEPT
--
-- The professional's own travel radius, which is the limit that actually
-- matters: they decide how far they are willing to go, and an offer beyond it
-- wastes both sides' time. That check now matches what the application already
-- enforces when a booking is created - a radius that is set is honoured, and
-- one that is not set means no stated limit rather than a refusal.
--
-- Distance is only demanded when it is needed. A professional who has set a
-- travel radius needs both locations for it to be checked; nobody else is
-- asked for a postcode in order to be booked.

CREATE OR REPLACE FUNCTION public.enforce_mutual_agency_radius()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  e_lat double precision;
  e_lng double precision;
  c_lat double precision;
  c_lng double precision;
  c_radius double precision;
  miles double precision;
  lat1 double precision;
  lat2 double precision;
  dlat double precision;
  dlng double precision;
  a double precision;
BEGIN
  SELECT latitude, longitude
    INTO e_lat, e_lng
  FROM public.employer_profiles WHERE id = NEW.employer_id;

  SELECT latitude, longitude, travel_radius_miles
    INTO c_lat, c_lng, c_radius
  FROM public.candidate_profiles WHERE id = NEW.candidate_id;

  -- No stated travel radius means no stated limit. The professional still
  -- decides by accepting or declining the offer, which is what that decision
  -- is for.
  IF c_radius IS NULL OR c_radius <= 0 THEN
    RETURN NEW;
  END IF;

  -- From here a limit exists, so it has to be checkable. Saying which side is
  -- missing its postcode is the difference between a fixable message and a
  -- dead end.
  IF c_lat IS NULL OR c_lng IS NULL THEN
    RAISE EXCEPTION 'This professional has set a travel radius but no postcode, so the distance cannot be checked. Ask them to add one in Agency Settings.';
  END IF;
  IF e_lat IS NULL OR e_lng IS NULL THEN
    RAISE EXCEPTION 'Add your property postcode in Company Profile so we can check this shift is inside the professional''s travel radius.';
  END IF;

  lat1 := radians(e_lat);
  lat2 := radians(c_lat);
  dlat := radians(c_lat - e_lat);
  dlng := radians(c_lng - e_lng);
  a := sin(dlat/2)^2 + cos(lat1) * cos(lat2) * sin(dlng/2)^2;
  miles := 3958.7613 * 2 * atan2(sqrt(a), sqrt(greatest(0, 1-a)));

  IF miles > c_radius THEN
    RAISE EXCEPTION 'This property is %.1f miles away, outside the % mile travel radius this professional has set.', miles, round(c_radius);
  END IF;

  RETURN NEW;
END;
$function$;

-- The trigger existed only in the live database. Naming it here means a
-- rebuilt database carries the same rule, and the next person looking for it
-- finds it in the repository rather than nowhere.
DO $$
BEGIN
  IF to_regclass('public.agency_bookings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS agency_mutual_radius_before_booking ON public.agency_bookings;
    CREATE TRIGGER agency_mutual_radius_before_booking
      BEFORE INSERT OR UPDATE ON public.agency_bookings
      FOR EACH ROW EXECUTE FUNCTION public.enforce_mutual_agency_radius();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
