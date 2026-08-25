alter table public.candidate_profiles add column if not exists agency_violation_points integer not null default 0;
alter table public.candidate_profiles add column if not exists agency_status text not null default 'active';
alter table public.candidate_profiles add column if not exists agency_suspended_at timestamptz;
alter table public.candidate_profiles add column if not exists agency_suspension_reason text;

alter table public.agency_bookings add column if not exists cancellation_requested_by text;
alter table public.agency_bookings add column if not exists cancellation_requested_at timestamptz;
alter table public.agency_bookings add column if not exists cancellation_reason text;
alter table public.agency_bookings add column if not exists admin_fee_retained integer not null default 0;

create table if not exists public.agency_violations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  booking_id uuid references public.agency_bookings(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  violation_type text not null,
  points integer not null default 1 check (points > 0),
  notes text,
  created_by_user_id uuid,
  created_at timestamptz not null default now()
);
create unique index if not exists agency_violations_review_unique on public.agency_violations(review_id) where review_id is not null;
create index if not exists agency_violations_candidate_idx on public.agency_violations(candidate_id, created_at desc);

create table if not exists public.agency_mutual_blocks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  blocked_by_role text not null check (blocked_by_role in ('candidate','employer')),
  blocked_by_user_id uuid not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(candidate_id, employer_id, blocked_by_role)
);
create index if not exists agency_mutual_blocks_candidate_idx on public.agency_mutual_blocks(candidate_id);
create index if not exists agency_mutual_blocks_employer_idx on public.agency_mutual_blocks(employer_id);
alter table public.agency_mutual_blocks enable row level security;
alter table public.agency_violations enable row level security;

create or replace function public.recalculate_agency_violation_status(p_candidate uuid)
returns void language plpgsql security definer set search_path=public as $$
declare total_points integer;
begin
  select coalesce(sum(points),0) into total_points from public.agency_violations where candidate_id=p_candidate;
  update public.candidate_profiles
  set agency_violation_points=total_points,
      agency_status=case when total_points >= 3 then 'suspended' when total_points > 0 then 'warning' else 'active' end,
      agency_available=case when total_points >= 3 then false else agency_available end,
      agency_suspended_at=case when total_points >= 3 then coalesce(agency_suspended_at, now()) else null end,
      agency_suspension_reason=case when total_points >= 3 then 'Agency conduct policy: 3 violation points reached. Admin review required before reactivation.' else null end
  where id=p_candidate;
end; $$;

create or replace function public.apply_low_review_agency_violation()
returns trigger language plpgsql security definer set search_path=public as $$
declare b public.agency_bookings%rowtype;
declare candidate_user uuid;
declare employer_user uuid;
begin
  if new.booking_id is null or new.rating > 2 then return new; end if;
  select * into b from public.agency_bookings where id=new.booking_id;
  if b.id is null then return new; end if;
  select user_id into candidate_user from public.candidate_profiles where id=b.candidate_id;
  select user_id into employer_user from public.employer_profiles where id=b.employer_id;
  if new.reviewer_id = employer_user and new.reviewee_id = candidate_user then
    insert into public.agency_violations(candidate_id,booking_id,review_id,violation_type,points,notes,created_by_user_id)
    values(b.candidate_id,b.id,new.id,'low_property_rating',1,'Verified Agency shift rating of 2 stars or below.',new.reviewer_id)
    on conflict do nothing;
    perform public.recalculate_agency_violation_status(b.candidate_id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_low_review_agency_violation on public.reviews;
create trigger trg_low_review_agency_violation after insert on public.reviews for each row execute function public.apply_low_review_agency_violation();

create or replace function public.apply_resolved_no_show_violation()
returns trigger language plpgsql security definer set search_path=public as $$
declare cand uuid;
begin
  if old.status is distinct from new.status and new.status='resolved' and new.issue_type in ('no_show','professional_cancelled','left_early') then
    select candidate_id into cand from public.agency_bookings where id=new.booking_id;
    if cand is not null and not exists(select 1 from public.agency_violations where booking_id=new.booking_id and violation_type=new.issue_type) then
      insert into public.agency_violations(candidate_id,booking_id,violation_type,points,notes)
      values(cand,new.booking_id,new.issue_type,1,'Confirmed through WHC Agency case resolution.');
      perform public.recalculate_agency_violation_status(cand);
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_resolved_no_show_violation on public.agency_cases;
create trigger trg_resolved_no_show_violation after update on public.agency_cases for each row execute function public.apply_resolved_no_show_violation();