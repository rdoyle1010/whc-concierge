-- Two new kinds of document, and why they are not procedures.
--
-- A Normal Operating Procedure is a statement of facts about one building:
-- the dimensions, the depths, the bather load, who supervises and from where.
-- An Emergency Action Plan is an ordered list of who does what in the first
-- ninety seconds. Neither is a sequence of steps with a standard against each,
-- which is what 'sop' means here, and forcing them into that shape produces a
-- document that looks like a procedure and reads like a form.

alter table public.operational_documents
  drop constraint if exists operational_documents_kind_check;

alter table public.operational_documents
  add constraint operational_documents_kind_check
  check (kind in ('sop','risk-assessment','job-description','policy','checklist','nop','eap','safe-system'));
