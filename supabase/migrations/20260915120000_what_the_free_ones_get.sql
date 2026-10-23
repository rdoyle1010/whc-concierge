-- What the free ones get.
--
-- Members join free, so every AI call is a cost carried before any revenue.
-- The temptation is to put the whole lot behind the paywall. That would be a
-- mistake: the profile writer is not a member perk, it is how a thin profile
-- becomes sellable inventory, and charging for it is charging people to fill
-- in our own catalogue. Two pence to turn a signup into a complete, credible
-- profile is the cheapest acquisition this business will ever find.
--
-- So it stays free, and it stays bounded. An allowance does what a paywall
-- was meant to do - caps the exposure - without costing a single genuine
-- signup on day one.
--
-- Two tables, the same shape as standards_pricing: the code keeps its
-- defaults, a row here overrides one, and deleting the row puts the default
-- back.

create table if not exists public.ai_allowances (
  bucket text primary key,
  monthly_limit integer not null check (monthly_limit >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Usage, per person, per month, per kind of call.
--
-- The token columns are not needed to enforce anything. They are here because
-- the question that started this was "what does a member cost me", and that
-- was answered with an estimate because nothing recorded the answer. A count
-- tells you somebody used it eleven times. The tokens tell you what those
-- eleven times cost, which is the number an owner actually needs.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  -- 'YYYY-MM'. A rolling month rather than a lifetime allowance, because a
  -- therapist coming back in a year to update her profile should not find it
  -- spent.
  period text not null,
  used integer not null default 0 check (used >= 0),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket, period)
);

create index if not exists ai_usage_period_idx on public.ai_usage(period, bucket);

alter table public.ai_allowances enable row level security;
alter table public.ai_usage enable row level security;
revoke all on table public.ai_allowances from anon, authenticated;
revoke all on table public.ai_usage from anon, authenticated;
grant all on table public.ai_allowances to service_role;
grant all on table public.ai_usage to service_role;

-- One statement, because two tabs must not both spend the last one.
--
-- The whole check-and-increment happens inside the row lock. Reading the
-- count in the route and writing it back afterwards is the bug that lets
-- somebody double-click their way past a limit, and it is invisible until
-- somebody does.
create or replace function public.claim_ai_allowance(
  p_user_id uuid,
  p_bucket text,
  p_limit integer,
  p_period text
)
returns table (claimed boolean, used integer, allowed integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  insert into public.ai_usage (user_id, bucket, period, used)
  values (p_user_id, p_bucket, p_period, 0)
  on conflict (user_id, bucket, period) do nothing;

  select ai_usage.used into v_used
  from public.ai_usage
  where ai_usage.user_id = p_user_id
    and ai_usage.bucket = p_bucket
    and ai_usage.period = p_period
  for update;

  if v_used >= p_limit then
    return query select false, v_used, p_limit;
    return;
  end if;

  update public.ai_usage
  set used = ai_usage.used + 1, updated_at = now()
  where ai_usage.user_id = p_user_id
    and ai_usage.bucket = p_bucket
    and ai_usage.period = p_period
  returning ai_usage.used into v_used;

  return query select true, v_used, p_limit;
end;
$$;

revoke all on function public.claim_ai_allowance(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.claim_ai_allowance(uuid, text, integer, text) to service_role;

-- Giving a spent allowance back.
--
-- A call that was claimed and then failed - a timeout, a refusal, a draft cut
-- off before it finished - must not count. Somebody who pressed a button that
-- did not work has not had their turn, and telling them otherwise is the
-- quickest way to make a free allowance feel like a mean one.
create or replace function public.release_ai_allowance(
  p_user_id uuid,
  p_bucket text,
  p_period text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_usage
  set used = greatest(0, used - 1), updated_at = now()
  where user_id = p_user_id and bucket = p_bucket and period = p_period;
$$;

revoke all on function public.release_ai_allowance(uuid, text, text) from public, anon, authenticated;
grant execute on function public.release_ai_allowance(uuid, text, text) to service_role;
