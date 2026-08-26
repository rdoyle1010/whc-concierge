create or replace function private.protect_commercial_entitlements()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if current_user <> 'authenticated' or private.is_admin() then
    return new;
  end if;

  if tg_table_name = 'candidate_profiles' then
    if new.membership_tier is distinct from old.membership_tier
      or new.membership_started_at is distinct from old.membership_started_at
      or new.membership_renews_at is distinct from old.membership_renews_at
      or new.academy_discount_pct is distinct from old.academy_discount_pct
      or new.membership_stripe_subscription_id is distinct from old.membership_stripe_subscription_id
      or new.membership_stripe_customer_id is distinct from old.membership_stripe_customer_id
      or new.membership_cancel_at_period_end is distinct from old.membership_cancel_at_period_end
    then
      raise exception 'Commercial membership fields cannot be changed directly';
    end if;

    if coalesce(new.interview_ready_credits, 0) > coalesce(old.interview_ready_credits, 0)
      or coalesce(new.free_feature_credits, 0) > coalesce(old.free_feature_credits, 0)
    then
      raise exception 'Commercial credits cannot be increased directly';
    end if;

    if coalesce(new.is_featured, false) and not coalesce(old.is_featured, false) then
      raise exception 'Featured access cannot be enabled directly';
    end if;
    if new.featured_until is distinct from old.featured_until
       and new.featured_until is not null
       and (old.featured_until is null or new.featured_until > old.featured_until) then
      raise exception 'Featured access cannot be extended directly';
    end if;

    if coalesce(new.residency_member, false) and not coalesce(old.residency_member, false) then
      raise exception 'Residency membership cannot be enabled directly';
    end if;
    if new.residency_subscription_ends_at is distinct from old.residency_subscription_ends_at
       and new.residency_subscription_ends_at is not null
       and (old.residency_subscription_ends_at is null or new.residency_subscription_ends_at > old.residency_subscription_ends_at) then
      raise exception 'Residency membership cannot be extended directly';
    end if;
  elsif tg_table_name = 'employer_profiles' then
    if new.membership_tier is distinct from old.membership_tier
      or new.membership_started_at is distinct from old.membership_started_at
      or new.membership_renews_at is distinct from old.membership_renews_at
      or new.annual_job_allowance is distinct from old.annual_job_allowance
      or new.membership_stripe_subscription_id is distinct from old.membership_stripe_subscription_id
      or new.membership_stripe_customer_id is distinct from old.membership_stripe_customer_id
      or new.membership_cancel_at_period_end is distinct from old.membership_cancel_at_period_end
    then
      raise exception 'Commercial membership fields cannot be changed directly';
    end if;

    if coalesce(new.annual_jobs_used, 0) < coalesce(old.annual_jobs_used, 0) then
      raise exception 'Job allowance usage cannot be reduced directly';
    end if;

    if coalesce(new.featured_employer, false) and not coalesce(old.featured_employer, false) then
      raise exception 'Featured access cannot be enabled directly';
    end if;
    if new.featured_until is distinct from old.featured_until
       and new.featured_until is not null
       and (old.featured_until is null or new.featured_until > old.featured_until) then
      raise exception 'Featured access cannot be extended directly';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_candidate_commercial_entitlements on public.candidate_profiles;
create trigger protect_candidate_commercial_entitlements
before update on public.candidate_profiles
for each row execute function private.protect_commercial_entitlements();

drop trigger if exists protect_employer_commercial_entitlements on public.employer_profiles;
create trigger protect_employer_commercial_entitlements
before update on public.employer_profiles
for each row execute function private.protect_commercial_entitlements();
