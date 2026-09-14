-- Files she adds to a pack herself.
--
-- The compliance register this library grew out of is a spreadsheet, and a
-- spreadsheet is the right shape for it: a register is a live thing somebody
-- filters and sorts, and rewriting it as a PDF would be turning a tool back
-- into a picture of one.
--
-- So a pack can carry files as well as documents, and she puts them there
-- without a deploy. Anything: a workbook, a Word template, a poster to
-- laminate, a plant room label sheet.

create table if not exists public.standards_attachments (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  -- Where it sits in the private bucket, and what it is.
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes integer not null check (size_bytes >= 0),

  -- Which packs and bundles include it. A slug here may be either, because a
  -- buyer does not know the difference and should not have to.
  pack_slugs text[] not null default '{}',

  -- Off until she says so. A file half uploaded and visible is a file
  -- somebody downloads half of.
  is_live boolean not null default false,
  sort_order integer not null default 0,

  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists standards_attachments_live_idx
  on public.standards_attachments(is_live, sort_order);

alter table public.standards_attachments enable row level security;
revoke all on table public.standards_attachments from anon, authenticated;
grant all on table public.standards_attachments to service_role;

-- Private, always. These are sold, and a public bucket is a bucket whose
-- contents are one guessed URL away from being free.
insert into storage.buckets (id, name, public)
values ('standards-files', 'standards-files', false)
on conflict (id) do update set public = false;
