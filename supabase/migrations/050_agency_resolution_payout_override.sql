create or replace function public.enforce_agency_full_rate_payout()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.payout_status, 'pending') <> 'paid' then
    if coalesce(new.dispute_status, '') = 'resolved' and new.payout_amount is not null then
      return new;
    end if;
    new.payout_amount := round(
      coalesce(new.rate, 0)::numeric * coalesce(nullif(new.hours, 0), 8)::numeric
    )::integer;
  end if;
  return new;
end;
$$;