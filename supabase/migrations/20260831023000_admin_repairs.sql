-- Admin repairs (31 Aug 2026): the Academy downloads store that the admin
-- page has always expected, plus its private storage bucket. Additive and
-- idempotent - safe to run twice.

create table if not exists public.academy_download_resources (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  module_index integer,
  title text not null,
  description text,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academy_download_resources_course_idx on public.academy_download_resources(course_slug, is_active, module_index);
alter table public.academy_download_resources enable row level security;
revoke all on table public.academy_download_resources from anon, authenticated;
grant all on table public.academy_download_resources to service_role;

-- Private bucket for the files themselves (served via signed URLs only).
insert into storage.buckets (id, name, public)
values ('academy-downloads', 'academy-downloads', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
