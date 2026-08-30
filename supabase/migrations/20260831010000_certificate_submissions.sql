-- Certificate submissions (31 Aug 2026): structured qualification records
-- with a review lifecycle, replacing anonymous "Certificate 1" PDF links.
-- Additive and idempotent - the legacy certificates_urls column is untouched
-- (existing files show as "details needed" until the therapist adds context).

create table if not exists public.certificate_submissions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  title text not null,
  awarding_body text,
  country text,
  year_awarded integer,
  document_url text not null,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected','more_info')),
  review_note text,
  verified_at timestamptz,
  verified_source text check (verified_source in ('document_verified','employer_confirmed','academy_assessed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists certificate_submissions_candidate_idx on public.certificate_submissions(candidate_id, created_at desc);
create index if not exists certificate_submissions_status_idx on public.certificate_submissions(status);
create unique index if not exists certificate_submissions_doc_idx on public.certificate_submissions(candidate_id, document_url);
alter table public.certificate_submissions enable row level security;
revoke all on table public.certificate_submissions from anon, authenticated;
grant all on table public.certificate_submissions to service_role;

notify pgrst, 'reload schema';
