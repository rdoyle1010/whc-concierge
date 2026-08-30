import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const DEFAULT_PER_PAGE = 25
const MAX_PER_PAGE = 100
const ALLOWED_STATUSES = new Set(['draft','pending','reviewed','shortlisted','interview','offered','accepted','rejected','withdrawn'])
const APPLICATION_SELECT = `id,status,match_score,cover_note,cover_letter,created_at,updated_at,submitted_at,role_id,job_id,archived_at,job_listings(id,job_title,job_description,location,salary_min,salary_max,employer_id,is_live,expires_at,contract_type,job_type,required_role_level,required_skills,required_brands,required_qualifications,min_years_experience,preferred_business_skills,required_systems,latitude,longitude,radius_miles,shift_pattern,offers_accommodation,insurance_required,is_agency_role)`
const CANDIDATE_MATCH_FIELDS = 'id,role_level,has_insurance,treatment_skills,services_offered,product_houses,qualifications,experience_years,years_experience,systems_experience,latitude,longitude,travel_radius_miles,max_commute,transport_method,location_preferences,shift_preferences,needs_accommodation,profile_completion_score,profile_completion_pct,review_score'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const pageParam = Number(req.nextUrl.searchParams.get('page'))
  const perPageParam = Number(req.nextUrl.searchParams.get('per_page'))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
  const perPage = Number.isFinite(perPageParam) && perPageParam > 0 ? Math.min(Math.floor(perPageParam), MAX_PER_PAGE) : DEFAULT_PER_PAGE
  const statusParam = req.nextUrl.searchParams.get('status') || 'all'
  const status = ALLOWED_STATUSES.has(statusParam) ? statusParam : 'all'
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const admin = createAdminClient()
  const { data: candidate, error: candidateError } = await admin.from('candidate_profiles').select(CANDIDATE_MATCH_FIELDS).eq('user_id', user.id).maybeSingle()
  if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 })
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

  let query = admin.from('applications').select(APPLICATION_SELECT, { count: 'exact' })
    .eq('candidate_id', candidate.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  // My Applications is for applications that have actually been sent.
  // Drafts belong to the Apply/Review & Send journey and must not appear as
  // submitted recruitment activity simply because a role was matched or opened.
  if (status === 'all') query = query.neq('status', 'draft')
  else query = query.eq('status', status)

  const [{ data: rows, error, count }, { data: statusRows, error: countsError }] = await Promise.all([
    query,
    admin.from('applications').select('status').eq('candidate_id', candidate.id).is('archived_at', null).neq('status', 'draft'),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (countsError) return NextResponse.json({ error: countsError.message }, { status: 500 })

  let applications = (rows || []).map((application: any) => application.job_listings ? ({
    ...application,
    job_listings: {
      ...application.job_listings,
      title: application.job_listings.job_title,
      description: application.job_listings.job_description,
      required_product_houses: application.job_listings.required_brands,
    },
  }) : application)

  const employerIds = Array.from(new Set(applications.map((application: any) => application.job_listings?.employer_id).filter(Boolean)))
  if (employerIds.length) {
    const { data: employers } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').in('id', employerIds)
    const employerMap = new Map((employers || []).map((employer: any) => [employer.id, employer]))
    applications = applications.map((application: any) => application.job_listings ? ({
      ...application,
      job_listings: { ...application.job_listings, employer_profiles: employerMap.get(application.job_listings.employer_id) || null },
    }) : application)
  }

  const counts: Record<string, number> = { all: 0 }
  for (const row of statusRows || []) {
    counts[row.status] = (counts[row.status] || 0) + 1
    counts.all += 1
  }
  const total = count || 0

  return NextResponse.json({ applications, profile: candidate, counts, pagination: { page, per_page: perPage, total, total_pages: Math.max(1, Math.ceil(total / perPage)), has_more: to + 1 < total } })
}
