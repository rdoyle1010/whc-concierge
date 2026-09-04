-- 20260904190000: The arrival pack starts being built at all.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- generate_booking_arrival_pack has never once produced a pack, for any
-- booking, of either type. Running it by hand gives:
--
--   ERROR: record "b" has no field "start_date"
--
-- The payload builds its booking section with a SQL CASE holding an agency
-- branch and a residency branch:
--
--   'booking', case when p_booking_type = 'agency'
--     then jsonb_build_object('date', b.shift_date, ...)
--     else jsonb_build_object('start_date', b.start_date, ...) end
--
-- PL/pgSQL resolves every field referenced in that expression against the
-- record it holds, whichever branch would win. So an agency booking dies on
-- the residency columns, and a residency booking would die on shift_date. The
-- branch was never the point of failure; naming both sets of columns in one
-- expression was.
--
-- Fixed by branching procedurally instead, so only the columns that exist on
-- the row in hand are ever named.
--
-- And rebuilt to read through jsonb rather than record fields. A pack is
-- assembled from around fifty optional columns across two tables, and any one
-- of them missing took the whole thing down with an error nobody saw - the
-- trigger swallowed it and the professional simply got no pack. Read as jsonb,
-- an absent column is null and the pack is built from whatever the property
-- has actually filled in, which is the behaviour a briefing document wants.

CREATE OR REPLACE FUNCTION public.generate_booking_arrival_pack(p_booking_type text, p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b jsonb;
  e jsonb;
  f jsonb;
  booking_json jsonb;
  residency_json jsonb;
  payload jsonb;
  -- Prefixed, because a variable named employer_id makes
  -- "where t.employer_id = employer_id" ambiguous and Postgres refuses it.
  v_employer_id uuid;
  v_candidate_id uuid;
  v_fact_file_id uuid;
BEGIN
  IF p_booking_type = 'agency' THEN
    SELECT to_jsonb(t) INTO b FROM public.agency_bookings t
    WHERE t.id = p_booking_id AND t.status IN ('accepted', 'confirmed', 'completed');
  ELSIF p_booking_type = 'residency' THEN
    SELECT to_jsonb(t) INTO b FROM public.residency_bookings t
    WHERE t.id = p_booking_id AND t.status IN ('confirmed', 'paid', 'active', 'completed');
  ELSE
    RETURN;
  END IF;
  IF b IS NULL THEN RETURN; END IF;

  v_employer_id := (b->>'employer_id')::uuid;
  v_candidate_id := (b->>'candidate_id')::uuid;

  SELECT to_jsonb(t) INTO e FROM public.employer_profiles t WHERE t.id = v_employer_id;
  IF e IS NULL THEN RETURN; END IF;

  SELECT to_jsonb(t) INTO f FROM public.property_fact_files t WHERE t.employer_id = v_employer_id;
  f := coalesce(f, '{}'::jsonb);
  v_fact_file_id := nullif(f->>'id', '')::uuid;

  -- Only the columns that exist on the row in hand.
  IF p_booking_type = 'agency' THEN
    booking_json := jsonb_build_object(
      'date', b->'shift_date',
      'start_time', b->'shift_start_time',
      'end_time', b->'shift_end_time',
      'shift_type', b->'shift_type',
      'specialism', b->'specialism',
      'notes', b->'notes'
    );
    residency_json := NULL;
  ELSE
    booking_json := jsonb_build_object(
      'start_date', b->'start_date',
      'end_date', b->'end_date',
      'days_required', b->'days_required',
      'services_required', b->'services_required',
      'accommodation_included', b->'accommodation_included',
      'travel_included', b->'travel_included',
      'notes', b->'notes'
    );
    residency_json := jsonb_build_object(
      'accommodation', f->'residency_accommodation',
      'accommodation_address', f->'residency_accommodation_address',
      'check_in', f->'residency_check_in',
      'check_out', f->'residency_check_out',
      'travel_arrangements', f->'residency_travel_arrangements',
      'staff_contacts', f->'residency_staff_contacts',
      'programme_brief', f->'residency_programme_brief',
      'facilities_access', f->'residency_facilities_access',
      'commercial_targets', f->'residency_commercial_targets',
      'working_pattern', f->'residency_working_pattern',
      'laundry_housekeeping', f->'residency_laundry_housekeeping',
      'expenses_process', f->'residency_expenses_process',
      'local_information', f->'residency_local_information',
      'other_notes', f->'residency_other_notes'
    );
  END IF;

  payload := jsonb_build_object(
    'type', p_booking_type,
    'property', jsonb_build_object(
      'name', coalesce(e->>'property_name', e->>'company_name'),
      'address', coalesce(
        nullif(f->>'property_address', ''),
        nullif(concat_ws(', ', e->>'address', e->>'city', e->>'postcode', e->>'country'), '')
      ),
      'map_url', f->'map_url',
      'directions', f->'directions',
      'nearest_transport', coalesce(f->'nearest_transport', e->'nearest_transport'),
      'parking_available', coalesce(f->'parking_available', e->'parking_available'),
      'parking_details', f->'parking_details',
      'staff_entrance', f->'staff_entrance'
    ),
    'arrival', jsonb_build_object(
      'contact_name', coalesce(f->>'arrival_contact_name', e->>'contact_name', e->>'spa_director_name'),
      'contact_role', f->'arrival_contact_role',
      'phone', coalesce(f->>'arrival_phone', e->>'contact_phone'),
      'recommended_buffer_minutes', coalesce((f->>'recommended_arrival_buffer_minutes')::int, 15),
      'uniform_required', f->'uniform_required',
      'bring', f->'worker_should_bring',
      'changing_facilities', f->'changing_facilities',
      'locker_information', f->'locker_information'
    ),
    'welfare', jsonb_build_object(
      'food_provided', f->'food_provided',
      'staff_restaurant', f->'staff_restaurant',
      'refreshments', f->'refreshments',
      'break_policy', f->'break_policy'
    ),
    'safety', jsonb_build_object(
      'fire_emergency_basics', f->'fire_emergency_basics',
      'assembly_point', f->'assembly_point',
      'health_safety_acknowledgement', f->'health_safety_acknowledgement'
    ),
    'spa', jsonb_build_object(
      'products_brands', coalesce(
        nullif(f->>'products_brands', ''),
        (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(e->'product_houses_used') = 'array' THEN e->'product_houses_used'
               WHEN jsonb_typeof(e->'product_houses') = 'array' THEN e->'product_houses'
               ELSE '[]'::jsonb END))
      ),
      'treatment_protocols', f->'treatment_protocols',
      'booking_system', coalesce(
        nullif(f->>'booking_system', ''),
        (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(e->'systems_used') = 'array' THEN e->'systems_used' ELSE '[]'::jsonb END))
      ),
      'retail_commission', f->'retail_commission',
      'treatment_commission', f->'treatment_commission',
      'gratuities_service_charge', f->'gratuities_service_charge',
      'retail_targets', f->'retail_targets',
      'guest_service_standards', f->'guest_service_standards',
      'property_rules', f->'property_rules'
    ),
    'documents', CASE WHEN jsonb_typeof(f->'useful_documents') = 'array' THEN f->'useful_documents' ELSE '[]'::jsonb END,
    'booking', booking_json,
    'residency', residency_json
  );

  INSERT INTO public.booking_arrival_packs
    (booking_type, booking_id, employer_id, candidate_id, fact_file_id, snapshot, generated_at, updated_at)
  VALUES
    (p_booking_type, p_booking_id, v_employer_id, v_candidate_id, v_fact_file_id, payload, now(), now())
  ON CONFLICT (booking_type, booking_id) DO UPDATE SET
    snapshot = excluded.snapshot,
    fact_file_id = excluded.fact_file_id,
    generated_at = excluded.generated_at,
    updated_at = now();
END;
$function$;

-- Now that it can build one, build the packs that should already exist. The
-- failure is deliberately not swallowed this time: a run that generates
-- nothing should say why rather than reporting success.
DO $backfill$
DECLARE
  target uuid;
  made integer := 0;
BEGIN
  IF to_regclass('public.agency_bookings') IS NULL THEN RETURN; END IF;
  FOR target IN
    SELECT id FROM public.agency_bookings WHERE status IN ('accepted', 'confirmed', 'completed')
  LOOP
    PERFORM public.generate_booking_arrival_pack('agency', target);
    made := made + 1;
  END LOOP;
  RAISE NOTICE 'arrival packs attempted for % agency bookings', made;
END $backfill$;

NOTIFY pgrst, 'reload schema';
