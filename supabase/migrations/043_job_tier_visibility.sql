create or replace function public.get_public_jobs_page(
  p_search text default null,
  p_location text default null,
  p_offset integer default 0,
  p_limit integer default 12
)
returns table(
  id uuid,
  job_title text,
  job_description text,
  salary_min integer,
  salary_max integer,
  salary_display_text text,
  job_type text,
  location text,
  tier text,
  posted_date timestamptz,
  employer jsonb,
  total_count bigint
)
language sql
stable
set search_path to 'public'
as $function$
  select
    j.id,
    j.job_title,
    j.job_description,
    j.salary_min,
    j.salary_max,
    j.salary_display_text,
    j.job_type,
    j.location,
    j.tier,
    j.posted_date,
    jsonb_build_object(
      'company_name', coalesce(e.property_name, e.company_name),
      'property_name', e.property_name,
      'property_photos', e.property_photos,
      'tagline', e.tagline,
      'review_score', e.review_score,
      'review_count', e.review_count,
      'star_rating', e.star_rating
    ) as employer,
    count(*) over() as total_count
  from public.job_listings j
  left join public.employer_profiles e on e.id = j.employer_id
  where j.is_live = true
    and (j.expires_at is null or j.expires_at > now())
    and (
      nullif(trim(p_search), '') is null
      or j.job_title ilike '%' || trim(p_search) || '%'
      or coalesce(e.property_name, '') ilike '%' || trim(p_search) || '%'
      or coalesce(e.company_name, '') ilike '%' || trim(p_search) || '%'
    )
    and (
      nullif(trim(p_location), '') is null
      or coalesce(j.location, '') ilike '%' || trim(p_location) || '%'
    )
  order by
    case lower(coalesce(j.tier, ''))
      when 'platinum' then 4
      when 'gold' then 3
      when 'silver' then 2
      when 'bronze' then 1
      else 0
    end desc,
    j.posted_date desc nulls last,
    j.id desc
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$function$;
