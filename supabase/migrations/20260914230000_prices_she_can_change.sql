-- Prices she can change, and bundles she can build.
--
-- Every price in this library was a constant in the code, which meant a price
-- change was a deploy and a conversation. A price is a commercial decision
-- made on a Tuesday afternoon, often in response to something a buyer said,
-- and it should not need anybody technical.
--
-- The code keeps its defaults. A row here overrides one, and deleting the row
-- puts the default back, so a bad decision at four in the afternoon is one
-- click from being undone.

create table if not exists public.standards_pricing (
  key text primary key,
  price_pence integer not null check (price_pence >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- A bundle is whatever she says it is: any packs, any individual documents,
-- one price. The alternative is asking for a new pack to be coded every time
-- a hotel group wants the pool procedure and the risk register together.
create table if not exists public.standards_bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  blurb text,
  price_pence integer not null check (price_pence >= 0),

  pack_slugs text[] not null default '{}',
  document_references text[] not null default '{}',

  -- Off until she says so. A bundle half built and visible is a bundle
  -- somebody buys half of.
  is_live boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists standards_bundles_live_idx
  on public.standards_bundles(is_live, sort_order);

alter table public.standards_pricing enable row level security;
alter table public.standards_bundles enable row level security;
revoke all on table public.standards_pricing from anon, authenticated;
revoke all on table public.standards_bundles from anon, authenticated;
grant all on table public.standards_pricing to service_role;
grant all on table public.standards_bundles to service_role;
