import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canEmployerDiscoverCandidate, mutualRadiusResult, travelAccessSummary } from '@/lib/discovery'
import { calculateMatchScore } from '@/lib/matching'

export const dynamic = 'force-dynamic'

const EMPLOYER_CANDIDATE_FIELDS = [
  'id', 'user_id', 'full_name', 'headline', 'role_level', 'location', 'services_offered',
  'experience_years', 'profile_image_url', 'review_score', 'bio', 'qualifications',
  'product_houses', 'systems_experience', 'business_skills', 'career_evidence', 'cv_url', 'has_insurance',
  'availability_status', 'travel_radius_miles', 'has_car', 'latitude', 'longitude',
  'approval_status', 'profile_visible', 'is_featured', 'featured_until', 'created_at',
].join(',')

const DEFAULT_LIMIT = 60
const MAX_LIMIT = 100

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in as an employer' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin
    .from('employer_profiles')
    .select('id, company_name, property_name, approval_status, latitude, longitude, postcode, commute_car_required, nearest_transport, transport_walk_minutes, parking_available, taxi_support, taxi_notes, travel_notes')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
  if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved before viewing talent profiles' }, { status: 403 })

  const requestedRadius = Number(req.nextUrl.searchParams.get('radius'))
  const radius = Number.isFinite(requestedRadius) && requestedRadius > 0 ? Math.min(requestedRadius, 250) : null
  const requestedLimit = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), MAX_LIMIT) : DEFAULT_LIMIT
  const requestedOffset = Number(req.nextUrl.searchParams.get('offset'))
  const offset = Number.isFinite(requestedOffset) && requestedOffset > 0 ? Math.floor(requestedOffset) : 0
  const requestedCandidateId = req.nextUrl.searchParams.get('candidate')
  const now = new Date().toISOString()

  const candidatePageQuery = admin.from('candidate_profiles')
    .select(EMPLOYER_CANDIDATE_FIELDS)
    .eq('approval_status', 'approved')
    .or('profile_visible.eq.true,profile_visible.is.null')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const requestedCandidatePromise = requestedCandidateId
    ? admin.from('candidate_profiles').select(EMPLOYER_CANDIDATE_FIELDS).eq('id', requestedCandidateId).eq('approval_status', 'approved').or('profile_visible.eq.true,profile_visible.is.null').maybeSingle()
    : Promise.resolve({ data: null, error: null })

  const [{ data: blocks }, { data: pageRows, error }, { data: requestedCandidate }, { data: liveJobs }] = await Promise.all([
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
    candidatePageQuery,
    requestedCandidatePromise,
    admin.from('job_listings')
      .select('id,job_title,required_skills,required_brands,required_qualifications,salary_min,salary_max,job_type,work_setting,sector,location,min_years_experience,required_systems,required_management_skills,required_role_level,candidate_scope,location_postcode,radius_miles,contract_type,insurance_required,preferred_business_skills,shift_pattern,offers_accommodation,latitude,longitude')
      .eq('employer_id', employer.id).eq('is_live', true).or(`expires_at.is.null,expires_at.gt.${now}`).limit(25),
  ])

  if (error) return NextResponse.json({ error: 'Talent directory unavailable' }, { status: 500 })

  const jobs = (liveJobs || []).map((job: any) => ({ ...job, title: job.job_title, required_product_houses: job.required_brands }))
  const blocked = new Set((blocks || []).map((row: any) => row.candidate_id))
  const origin = { latitude: employer.latitude, longitude: employer.longitude }

  const scoreCandidate = (candidate: any) => {
    if (!canEmployerDiscoverCandidate(candidate, blocked)) return null
    const radiusResult = mutualRadiusResult(origin, candidate, radius)
    if (!radiusResult.withinRadius) return null

    let best: any = null
    for (const job of jobs) {
      const result = calculateMatchScore(candidate, job)
      if (result.hardStop) continue
      if (!best || result.score > best.matchScore) {
        best = { matchScore: result.score, matchLabel: result.label, matchColour: result.colour, matchBg: result.bgColour, matchExplanation: result.matchExplanation, progression: result.progression || null, bestJob: job.title, bestJobId: job.id, roleDistanceMiles: result.distanceMiles }
      }
    }

    return { ...candidate, ...(best || {}), latitude: undefined, longitude: undefined, distance_miles: radiusResult.distanceMiles, distance_status: radiusResult.reason, within_radius: radiusResult.withinRadius }
  }

  const pageCandidates = (pageRows || []).map(scoreCandidate).filter(Boolean).sort((a: any, b: any) => {
    if (!!a.is_featured !== !!b.is_featured) return a.is_featured ? -1 : 1
    return (b.matchScore ?? -1) - (a.matchScore ?? -1)
  })

  const requestedScored = requestedCandidate ? scoreCandidate(requestedCandidate) : null
  const candidates = requestedScored && !pageCandidates.some((candidate: any) => candidate.id === requestedScored.id) ? [requestedScored, ...pageCandidates] : pageCandidates
  const scanned = (pageRows || []).length
  const hasMore = scanned === limit

  return NextResponse.json({ candidates, live_role_count: jobs.length, pagination: { limit, offset, returned: candidates.length, scanned, has_more: hasMore, next_offset: hasMore ? offset + scanned : null }, employer: { id: employer.id, company_name: employer.company_name, property_name: employer.property_name }, origin: { postcode: employer.postcode || null, geocoded: employer.latitude != null && employer.longitude != null }, travel: travelAccessSummary(employer) })
}
