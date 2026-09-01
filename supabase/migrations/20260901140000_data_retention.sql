-- 20260901140000: Retention run log, completed.
--
-- Additive and idempotent. Safe to run more than once, safe to run before or
-- after 20260901120000_data_retention.sql, and safe to run on a database where
-- that earlier migration was never applied - the table is created here if it is
-- missing and only widened if it already exists.
--
-- retention_runs is the audit trail for the on-demand sweep at
-- /api/admin/retention. It records when the sweep ran, what it removed, and -
-- new here - which administrator ran it, so a deletion of personal data can be
-- attributed to a person rather than to "the system". Service-role only, in the
-- style of 031_security_rescue.sql and 040_security_alignment.sql.
--
-- The application works before and after this migration: the sweep route
-- inserts run_by and, if the column is not there yet, retries the insert
-- without it (the house fallback pattern), so the sweep is never blocked by an
-- unapplied migration.

create table if not exists public.retention_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb,
  run_by uuid
);

-- Present already where 20260901120000 created the table without it.
alter table public.retention_runs add column if not exists run_by uuid;

create index if not exists retention_runs_ran_at_idx on public.retention_runs(ran_at desc);

-- The administrator who ran the sweep. ON DELETE SET NULL so closing an admin
-- account never destroys the record that a retention sweep happened.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.retention_runs'::regclass
      and conname = 'retention_runs_run_by_fkey'
  ) then
    alter table public.retention_runs
      add constraint retention_runs_run_by_fkey
      foreign key (run_by) references auth.users(id) on delete set null;
  end if;
end $$;

-- Re-asserted rather than assumed: this file must stand on its own.
alter table public.retention_runs enable row level security;
revoke all on table public.retention_runs from anon, authenticated;
grant all on table public.retention_runs to service_role;

NOTIFY pgrst, 'reload schema';
