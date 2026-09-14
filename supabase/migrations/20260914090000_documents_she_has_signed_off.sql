-- The document library, and the fact that nothing leaves it unread.
--
-- These are operational documents a property pays for and then relies on:
-- procedures its team is trained against, risk assessments its managers sign,
-- job descriptions it recruits from. A generated draft that reached a client
-- without a person reading it would be the single worst thing this platform
-- could do, and it would be discovered by somebody else, later, in front of
-- an assessor.
--
-- So status is not decoration. A document is draft until she has read it and
-- pressed approve, and only an approved document can be issued to anybody.
-- The approval is recorded against her name and the version it applied to,
-- because approving version one says nothing about version four.

create table if not exists public.operational_documents (
  id uuid primary key default gen_random_uuid(),

  -- DEPT-TOPIC-KIND-NNN. Unique, because it is what other documents point at
  -- and what a client files under, and two documents sharing one is a filing
  -- system that has quietly stopped working.
  reference text not null unique,
  kind text not null default 'sop' check (kind in ('sop','risk-assessment','job-description','policy')),
  title text not null,
  department text,
  version text not null default '1.0',

  -- The document itself. One column rather than thirty, because the shape is
  -- defined and validated in src/lib/documents/types.ts and Postgres refuses
  -- a whole statement over one unknown column name, which has cost this
  -- platform three registrations already.
  document jsonb not null default '{}'::jsonb,

  status text not null default 'draft' check (status in ('draft','approved','retired')),

  -- Who signed it off, when, and for which version. Approving 1.0 says
  -- nothing about 1.4, so an edit clears these and it goes round again.
  approved_by uuid references auth.users(id) on delete set null,
  approved_by_name text,
  approved_at timestamptz,
  approved_version text,

  -- Set when it is generated for one property rather than held as a template.
  employer_id uuid references public.employer_profiles(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operational_documents_library_idx
  on public.operational_documents(kind, status, created_at desc)
  where employer_id is null;

create index if not exists operational_documents_property_idx
  on public.operational_documents(employer_id, created_at desc);

alter table public.operational_documents enable row level security;
revoke all on table public.operational_documents from anon, authenticated;
grant all on table public.operational_documents to service_role;
