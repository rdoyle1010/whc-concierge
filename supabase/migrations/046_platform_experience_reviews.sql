create table if not exists public.platform_experience_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  reviewer_user_id uuid not null,
  reviewer_role text not null check (reviewer_role in ('talent','employer')),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(application_id, reviewer_user_id)
);

alter table public.platform_experience_reviews enable row level security;
revoke all on table public.platform_experience_reviews from anon, authenticated;
grant all on table public.platform_experience_reviews to service_role;

create index if not exists platform_experience_reviews_application_idx on public.platform_experience_reviews(application_id);
create index if not exists platform_experience_reviews_reviewer_idx on public.platform_experience_reviews(reviewer_user_id);
