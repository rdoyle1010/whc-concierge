-- Property Fact File + automatic Before You Arrive snapshots
-- Applied to production as migration property_fact_file_arrival_packs.

create table if not exists public.property_fact_files (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null unique references public.employer_profiles(id) on delete cascade,
  property_address text,
  directions text,
  map_url text,
  nearest_transport text,
  parking_available boolean,
  parking_details text,
  staff_entrance text,
  arrival_contact_name text,
  arrival_contact_role text,
  arrival_phone text,
  recommended_arrival_buffer_minutes integer default 15 check (recommended_arrival_buffer_minutes between 0 and 120),
  uniform_required text,
  worker_should_bring text,
  changing_facilities text,
  locker_information text,
  food_provided text,
  staff_restaurant text,
  refreshments text,
  break_policy text,
  fire_emergency_basics text,
  assembly_point text,
  health_safety_acknowledgement text,
  products_brands text,
  treatment_protocols text,
  booking_system text,
  retail_commission text,
  treatment_commission text,
  gratuities_service_charge text,
  retail_targets text,
  guest_service_standards text,
  property_rules text,
  useful_documents jsonb not null default '[]'::jsonb,
  residency_accommodation text,
  residency_accommodation_address text,
  residency_check_in text,
  residency_check_out text,
  residency_travel_arrangements text,
  residency_staff_contacts text,
  residency_programme_brief text,
  residency_facilities_access text,
  residency_commercial_targets text,
  residency_working_pattern text,
  residency_laundry_housekeeping text,
  residency_expenses_process text,
  residency_local_information text,
  residency_other_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_arrival_packs (
  id uuid primary key default gen_random_uuid(),
  booking_type text not null check (booking_type in ('agency','residency')),
  booking_id uuid not null,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  fact_file_id uuid references public.property_fact_files(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (booking_type, booking_id)
);

create index if not exists booking_arrival_packs_candidate_idx on public.booking_arrival_packs(candidate_id, generated_at desc);
create index if not exists booking_arrival_packs_employer_idx on public.booking_arrival_packs(employer_id, generated_at desc);

alter table public.property_fact_files enable row level security;
alter table public.booking_arrival_packs enable row level security;

drop policy if exists property_fact_files_employer_select on public.property_fact_files;
create policy property_fact_files_employer_select on public.property_fact_files for select using (
  exists (select 1 from public.employer_profiles e where e.id = employer_id and e.user_id = auth.uid())
);
drop policy if exists property_fact_files_employer_insert on public.property_fact_files;
create policy property_fact_files_employer_insert on public.property_fact_files for insert with check (
  exists (select 1 from public.employer_profiles e where e.id = employer_id and e.user_id = auth.uid())
);
drop policy if exists property_fact_files_employer_update on public.property_fact_files;
create policy property_fact_files_employer_update on public.property_fact_files for update using (
  exists (select 1 from public.employer_profiles e where e.id = employer_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from public.employer_profiles e where e.id = employer_id and e.user_id = auth.uid())
);

drop policy if exists arrival_packs_employer_select on public.booking_arrival_packs;
create policy arrival_packs_employer_select on public.booking_arrival_packs for select using (
  exists (select 1 from public.employer_profiles e where e.id = employer_id and e.user_id = auth.uid())
);
drop policy if exists arrival_packs_candidate_select on public.booking_arrival_packs;
create policy arrival_packs_candidate_select on public.booking_arrival_packs for select using (
  exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid())
);
drop policy if exists arrival_packs_candidate_ack on public.booking_arrival_packs;
create policy arrival_packs_candidate_ack on public.booking_arrival_packs for update using (
  exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid())
);

create or replace function public.touch_property_fact_file() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_property_fact_file_touch on public.property_fact_files;
create trigger trg_property_fact_file_touch before update on public.property_fact_files for each row execute function public.touch_property_fact_file();

create or replace function public.generate_booking_arrival_pack(p_booking_type text, p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  b record;
  e record;
  f record;
  payload jsonb;
begin
  if p_booking_type = 'agency' then
    select * into b from public.agency_bookings where id = p_booking_id and status in ('confirmed','completed');
  elsif p_booking_type = 'residency' then
    select * into b from public.residency_bookings where id = p_booking_id and status in ('confirmed','paid','active','completed');
  else
    return;
  end if;
  if not found then return; end if;

  select * into e from public.employer_profiles where id = b.employer_id;
  if not found then return; end if;
  select * into f from public.property_fact_files where employer_id = b.employer_id;

  payload := jsonb_build_object(
    'type', p_booking_type,
    'property', jsonb_build_object(
      'name', coalesce(e.property_name, e.company_name),
      'address', coalesce(f.property_address, concat_ws(', ', e.address, e.city, e.postcode, e.country)),
      'map_url', f.map_url,
      'directions', f.directions,
      'nearest_transport', coalesce(f.nearest_transport, e.nearest_transport),
      'parking_available', coalesce(f.parking_available, e.parking_available),
      'parking_details', f.parking_details,
      'staff_entrance', f.staff_entrance
    ),
    'arrival', jsonb_build_object(
      'contact_name', coalesce(f.arrival_contact_name, e.contact_name, e.spa_director_name),
      'contact_role', f.arrival_contact_role,
      'phone', coalesce(f.arrival_phone, e.contact_phone),
      'recommended_buffer_minutes', coalesce(f.recommended_arrival_buffer_minutes, 15),
      'uniform_required', f.uniform_required,
      'bring', f.worker_should_bring,
      'changing_facilities', f.changing_facilities,
      'locker_information', f.locker_information
    ),
    'welfare', jsonb_build_object(
      'food_provided', f.food_provided,
      'staff_restaurant', f.staff_restaurant,
      'refreshments', f.refreshments,
      'break_policy', f.break_policy
    ),
    'safety', jsonb_build_object(
      'fire_emergency_basics', f.fire_emergency_basics,
      'assembly_point', f.assembly_point,
      'health_safety_acknowledgement', f.health_safety_acknowledgement
    ),
    'spa', jsonb_build_object(
      'products_brands', coalesce(f.products_brands, array_to_string(coalesce(e.product_houses_used, e.product_houses), ', ')),
      'treatment_protocols', f.treatment_protocols,
      'booking_system', coalesce(f.booking_system, array_to_string(e.systems_used, ', ')),
      'retail_commission', f.retail_commission,
      'treatment_commission', f.treatment_commission,
      'gratuities_service_charge', f.gratuities_service_charge,
      'retail_targets', f.retail_targets,
      'guest_service_standards', f.guest_service_standards,
      'property_rules', f.property_rules
    ),
    'documents', coalesce(f.useful_documents, '[]'::jsonb),
    'booking', case when p_booking_type = 'agency' then jsonb_build_object(
      'date', b.shift_date,
      'start_time', b.shift_start_time,
      'end_time', b.shift_end_time,
      'shift_type', b.shift_type,
      'specialism', b.specialism,
      'notes', b.notes
    ) else jsonb_build_object(
      'start_date', b.start_date,
      'end_date', b.end_date,
      'days_required', b.days_required,
      'services_required', b.services_required,
      'accommodation_included', b.accommodation_included,
      'travel_included', b.travel_included,
      'notes', b.notes
    ) end,
    'residency', case when p_booking_type = 'residency' then jsonb_build_object(
      'accommodation', f.residency_accommodation,
      'accommodation_address', f.residency_accommodation_address,
      'check_in', f.residency_check_in,
      'check_out', f.residency_check_out,
      'travel_arrangements', f.residency_travel_arrangements,
      'staff_contacts', f.residency_staff_contacts,
      'programme_brief', f.residency_programme_brief,
      'facilities_access', f.residency_facilities_access,
      'commercial_targets', f.residency_commercial_targets,
      'working_pattern', f.residency_working_pattern,
      'laundry_housekeeping', f.residency_laundry_housekeeping,
      'expenses_process', f.residency_expenses_process,
      'local_information', f.residency_local_information,
      'other_notes', f.residency_other_notes
    ) else null end
  );

  insert into public.booking_arrival_packs (booking_type, booking_id, employer_id, candidate_id, fact_file_id, snapshot, generated_at, updated_at)
  values (p_booking_type, p_booking_id, b.employer_id, b.candidate_id, f.id, payload, now(), now())
  on conflict (booking_type, booking_id) do update set
    snapshot = excluded.snapshot,
    fact_file_id = excluded.fact_file_id,
    generated_at = excluded.generated_at,
    updated_at = now();
end; $$;

create or replace function public.trg_generate_agency_arrival_pack() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('confirmed','completed') and (tg_op = 'INSERT' or old.status is distinct from new.status or old.paid_at is distinct from new.paid_at) then
    perform public.generate_booking_arrival_pack('agency', new.id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_agency_arrival_pack on public.agency_bookings;
create trigger trg_agency_arrival_pack after insert or update on public.agency_bookings for each row execute function public.trg_generate_agency_arrival_pack();

create or replace function public.trg_generate_residency_arrival_pack() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('confirmed','paid','active','completed') and (tg_op = 'INSERT' or old.status is distinct from new.status or old.paid_at is distinct from new.paid_at) then
    perform public.generate_booking_arrival_pack('residency', new.id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_residency_arrival_pack on public.residency_bookings;
create trigger trg_residency_arrival_pack after insert or update on public.residency_bookings for each row execute function public.trg_generate_residency_arrival_pack();
