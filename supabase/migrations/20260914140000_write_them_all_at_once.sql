-- Drafting four hundred and sixty documents without pressing a button four
-- hundred and sixty times.
--
-- Generating one document inside a web request was the wrong shape from the
-- start. It is bounded by a twenty-six second ceiling it kept hitting, it
-- costs a click each, and four hundred and sixty clicks at fifteen seconds is
-- an afternoon of somebody watching a spinner.
--
-- The batch API is built for precisely this: submit every document at once,
-- it runs asynchronously with no request timeout over it, and it costs half.
-- This table is the receipt. One row per submission, holding the provider's
-- batch id so results can be collected later, by a different request, on a
-- different day if need be.

create table if not exists public.document_batches (
  id uuid primary key default gen_random_uuid(),

  -- The provider's identifier for the run. Everything else here is ours.
  provider_batch_id text not null unique,

  -- Which tier was submitted, and how many documents went in.
  tier text check (tier is null or tier in ('day-1','month-1','quarter-1')),
  requested integer not null default 0,

  -- Collected on the way back in, so a half-collected batch can be resumed
  -- rather than started again.
  collected integer not null default 0,
  failed integer not null default 0,

  status text not null default 'submitted'
    check (status in ('submitted','collecting','done','failed')),
  note text,

  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_batches_open_idx
  on public.document_batches(status, created_at desc);

alter table public.document_batches enable row level security;
revoke all on table public.document_batches from anon, authenticated;
grant all on table public.document_batches to service_role;
