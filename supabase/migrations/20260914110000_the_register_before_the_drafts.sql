-- Room for the register, and for a checklist.
--
-- The library that has to exist is four hundred and sixty documents across
-- fourteen departments, tiered by when a property actually needs them. Two
-- things the first table did not allow for:
--
-- A checklist is not a procedure. The opening and closing safety checks are
-- CHK in the real library because somebody works down them with a pen, which
-- is a different document from one somebody is trained against.
--
-- And a document needs to know which tier it belongs to and why, because that
-- is the difference between a list of four hundred and sixty jobs and a plan
-- anybody can work through in order.

alter table public.operational_documents
  drop constraint if exists operational_documents_kind_check;

alter table public.operational_documents
  add constraint operational_documents_kind_check
  check (kind in ('sop','risk-assessment','job-description','policy','checklist'));

alter table public.operational_documents
  add column if not exists tier text
    check (tier is null or tier in ('day-1','month-1','quarter-1'));

alter table public.operational_documents
  add column if not exists tier_reason text;

create index if not exists operational_documents_tier_idx
  on public.operational_documents(tier, status)
  where employer_id is null;
