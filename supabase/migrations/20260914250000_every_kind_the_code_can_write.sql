-- The constraint that was two kinds behind the code.
--
-- operational_documents.kind is checked against a list, and the list has been
-- widened by hand each time a new kind of document was written. It was last
-- widened for the pool plans and the safe systems of work, and it never learnt
-- about the two guides that ship free with the pool safety pack.
--
-- So every import of that pack failed at the first guide, and because the
-- whole action stops on the first write error, the Normal Operating Procedure
-- and the Emergency Action Plan went in and the guide and the training guide
-- did not. The shop then reported "2 of 4 in that pack are signed off", which
-- read as work still to do rather than as a rejected write.
--
-- This sets the list to every kind the code can produce, including the two
-- new ones: a daily checklist and a management report. A test now compares
-- this list against the kinds defined in the code, so the next one cannot
-- ship without the list moving with it.

alter table public.operational_documents
  drop constraint if exists operational_documents_kind_check;

alter table public.operational_documents
  add constraint operational_documents_kind_check
  check (kind in (
    'sop',
    'job-description',
    'policy',
    'risk-assessment',
    'checklist',
    'nop',
    'eap',
    'safe-system',
    'guide',
    'training',
    'report'
  ));
