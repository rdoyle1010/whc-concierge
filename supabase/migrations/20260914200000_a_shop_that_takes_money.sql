-- What somebody bought from the Standards shop, and how they reach it.
--
-- A spa director buys without creating an account: they are buying a document,
-- not joining a platform, and a registration form between a decision and a
-- payment is where the decision goes to die. So the order carries a token, the
-- receipt email carries a link with it, and that link is the library.

create table if not exists public.standards_orders (
  id uuid primary key default gen_random_uuid(),

  -- Exactly one of these. A pack slug, or one document reference.
  pack_slug text,
  document_reference text,
  constraint standards_orders_one_thing
    check ((pack_slug is null) <> (document_reference is null)),

  buyer_email text not null,
  buyer_name text,
  property_name text,
  -- Set when the buyer happened to be signed in. Never required.
  buyer_user_id uuid references auth.users(id) on delete set null,

  amount_pence integer not null check (amount_pence >= 0),
  currency text not null default 'gbp',

  -- One row per Stripe session, so a webhook and a browser returning from
  -- Stripe at the same moment cannot deliver the same purchase twice.
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,

  -- The link. Long enough that it cannot be guessed, because it is the only
  -- thing standing between a stranger and somebody else's purchase.
  access_token text not null unique,

  -- Set when the receipt actually left, not when it was attempted.
  receipt_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists standards_orders_email_idx
  on public.standards_orders(lower(buyer_email), created_at desc);
create index if not exists standards_orders_user_idx
  on public.standards_orders(buyer_user_id, created_at desc);

-- Read only through the service role. A buyer reaches their library through a
-- route that checks the token; nothing here is exposed to the browser.
alter table public.standards_orders enable row level security;
revoke all on table public.standards_orders from anon, authenticated;
grant all on table public.standards_orders to service_role;
