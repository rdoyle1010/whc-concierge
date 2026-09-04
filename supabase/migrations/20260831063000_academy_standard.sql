-- Academy standard (31 Aug 2026): assessment attempt history for learner
-- records and accreditation readiness. Additive, idempotent.

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null,
  candidate_id uuid not null,
  course_slug text not null,
  score integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists assessment_attempts_enrollment_idx on public.assessment_attempts(enrollment_id, created_at desc);
create index if not exists assessment_attempts_course_idx on public.assessment_attempts(course_slug, created_at desc);
alter table public.assessment_attempts enable row level security;
revoke all on table public.assessment_attempts from anon, authenticated;
grant all on table public.assessment_attempts to service_role;

notify pgrst, 'reload schema';
