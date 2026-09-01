-- 20260901120000: Data retention and lawful account deletion.
--
-- Two things, both additive and idempotent, safe to run more than once and
-- safe to run before or after any other migration in this folder.
--
--   1. retention_runs - the audit trail for the on-demand retention sweep at
--      /api/admin/retention. Service-role only, in the style of
--      031_security_rescue.sql and 040_security_alignment.sql.
--
--   2. The nullability and foreign-key changes that let account deletion
--      ANONYMISE a financial record instead of destroying it. Today several
--      money-bearing tables either forbid a null person link or cascade the
--      delete, so erasing an account silently erases the accounting record
--      with it. UK company and tax law requires those amounts and dates to
--      survive for six years, so the link to the person is broken and the
--      transaction is kept.
--
-- The application works before and after this migration: every anonymisation
-- step in src/app/api/account/delete/route.ts is wrapped, and a failure is
-- reported back to the user as a record that could not be anonymised rather
-- than aborting the deletion.

-- ---------------------------------------------------------------------------
-- 1. Retention run log.
-- ---------------------------------------------------------------------------
create table if not exists public.retention_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb
);

create index if not exists retention_runs_ran_at_idx on public.retention_runs(ran_at desc);

alter table public.retention_runs enable row level security;
revoke all on table public.retention_runs from anon, authenticated;
grant all on table public.retention_runs to service_role;

-- ---------------------------------------------------------------------------
-- 2. Anonymisation must be possible on the statutory-retention tables.
-- ---------------------------------------------------------------------------
-- Helper: re-point a foreign key at ON DELETE SET NULL without needing to know
-- the constraint name, and only when it is not already set that way.
do $$
declare
  target record;
  constraint_row record;
  column_attnum smallint;
begin
  for target in
    select * from (values
      ('course_enrollments', 'candidate_id'),
      ('residency_bookings', 'employer_id'),
      ('residency_bookings', 'created_by')
    ) as t(table_name, column_name)
  loop
    if to_regclass('public.' || target.table_name) is null then
      continue;
    end if;

    select attnum into column_attnum
    from pg_attribute
    where attrelid = ('public.' || target.table_name)::regclass
      and attname = target.column_name
      and not attisdropped;
    if column_attnum is null then
      continue;
    end if;

    -- Drop NOT NULL so the link can be nulled at deletion time.
    execute format(
      'alter table public.%I alter column %I drop not null',
      target.table_name, target.column_name
    );

    for constraint_row in
      select conname, confdeltype
      from pg_constraint
      where conrelid = ('public.' || target.table_name)::regclass
        and contype = 'f'
        and conkey = array[column_attnum]::smallint[]
    loop
      if constraint_row.confdeltype <> 'n' then
        execute format(
          'alter table public.%I drop constraint %I',
          target.table_name, constraint_row.conname
        );
      end if;
    end loop;
  end loop;
end $$;

-- Recreate the three foreign keys that were dropped above, now as SET NULL.
-- Named explicitly so a repeat run is a no-op.
do $$
begin
  if to_regclass('public.course_enrollments') is not null
     and to_regclass('public.candidate_profiles') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.course_enrollments'::regclass
         and conname = 'course_enrollments_candidate_id_set_null_fkey'
     ) then
    alter table public.course_enrollments
      add constraint course_enrollments_candidate_id_set_null_fkey
      foreign key (candidate_id) references public.candidate_profiles(id) on delete set null;
  end if;

  if to_regclass('public.residency_bookings') is not null
     and to_regclass('public.employer_profiles') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.residency_bookings'::regclass
         and conname = 'residency_bookings_employer_id_set_null_fkey'
     ) then
    alter table public.residency_bookings
      add constraint residency_bookings_employer_id_set_null_fkey
      foreign key (employer_id) references public.employer_profiles(id) on delete set null;
  end if;

  if to_regclass('public.residency_bookings') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.residency_bookings'::regclass
         and conname = 'residency_bookings_created_by_set_null_fkey'
     ) then
    alter table public.residency_bookings
      add constraint residency_bookings_created_by_set_null_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
end $$;

-- placements, salary_records and commercial_purchases hold no foreign keys to
-- the person, only NOT NULL columns that would block anonymisation.
do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('placements', 'candidate_id'),
      ('placements', 'employer_id'),
      ('salary_records', 'candidate_id'),
      ('salary_records', 'employer_id'),
      ('commercial_purchases', 'user_id'),
      ('agency_bookings', 'candidate_id'),
      ('agency_bookings', 'employer_id')
    ) as t(table_name, column_name)
  loop
    if to_regclass('public.' || target.table_name) is null then
      continue;
    end if;
    if not exists (
      select 1 from pg_attribute
      where attrelid = ('public.' || target.table_name)::regclass
        and attname = target.column_name
        and not attisdropped
    ) then
      continue;
    end if;
    execute format(
      'alter table public.%I alter column %I drop not null',
      target.table_name, target.column_name
    );
  end loop;
end $$;

NOTIFY pgrst, 'reload schema';
