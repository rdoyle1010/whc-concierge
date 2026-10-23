-- The workbook she builds herself, in place of the one built in code.
--
-- The generated workbook is a floor, not a ceiling. It computes, and it
-- agrees with the documents beside it because both come from the same
-- register, but it cannot do a chart, a pivot or a conditional format, and
-- the person who knows how a spa director actually reads a month can build a
-- better one in an afternoon.
--
-- So an uploaded file can say it replaces the generated one. Stated as a
-- column rather than inferred from the file being a spreadsheet, because the
-- compliance register is a spreadsheet too, and a rule that guesses would
-- silently withdraw the reporting workbook the first time she uploaded a
-- register to the same pack.
--
-- Two workbooks in one pack is worse than either alone: the buyer has to work
-- out which is authoritative, and whichever they choose they will suspect the
-- other one disagreed.

alter table public.standards_attachments
  add column if not exists replaces_workbook boolean not null default false;

comment on column public.standards_attachments.replaces_workbook is
  'This file is the reporting workbook. Buyers who receive it are not offered the generated one.';
