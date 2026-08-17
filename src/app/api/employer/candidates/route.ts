import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canEmployerDiscoverCandidate, mutualRadiusResult, travelAccessSummary } from '@/lib/discovery'
import { calculateMatchScore } from '@/lib/matching'

export const dynamic = 'force-dynamic'

const EMPLOYER_CANDIDATE_FIELDS = [
  'id', 'user_id', 'full_name', 'headline', 'role_level', 'location', 'services_offered',
  'experience_years', 'profile_image_url', 'review_score', 'bio', 'qualifications',
  'product_houses', 'systems_experience', 'cv_url', 'has_insurance',
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
  if (employer.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Your employer account must be approved before viewing talent profiles' }, { status: 403 })
  }

  const requestedRadius = Number(req.nextUrl.searchParams.get('radius'))
  const radius = Number.isFinite(requestedRadius) && requestedRadius > 0 ? Math.min(requestedRadius, 250) : null
  const requestedLimit = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), MAX_LIMIT) : DEFAULT_LIMIT
  const now = new Date().toISOString()

  const [{ data: blocks }, { data: rows, error }, { data: liveJobs }] = await Promise.all([
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
    admin.from('candidate_profiles')
      .select(EMPLOYER_CANDIDATE_FIELDS)
      .eq('approval_status', 'approved')
      .or('profile_visible.eq.true,profile_visible.is.null')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit + 1),
    admin.from('job_listings')
      .select('*')
      .eq('employer_id', employer.id)
      .eq('is_live', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(25),
  ])

  if (error) return NextResponse.json({ error: 'Talent directory unavailable' }, { status: 500 })

  const jobs = (liveJobs || []).map((job: any) => ({
    ...job,
    title: job.job_title || job.title,
    required_product_houses: job.required_brands || job.required_product_houses,
  }))
  const blocked = new Set((blocks || []).map((row: any) => row.candidate_id))
  const origin = { latitude: employer.latitude, longitude: employer.longitude }

  const discoverable = (rows || [])
    .filter((candidate: any) => canEmployerDiscoverCandidate(candidate, blocked))
    .map((candidate: any) => {
      const radiusResult = mutualRadiusResult(origin, candidate, radius)
      let best: any = null
      for (const job of jobs) {
        const result = calculateMatchScore(candidate, job)
        if (result.hardStop) continue
        if (!best || result.score > best.matchScore) {
          best = {
            matchScore: result.score,
            matchLabel: result.label,
            matchColour: result.colour,
            matchBg: result.bgColour,
            matchExplanation: result.matchExplanation,
            bestJob: job.title,
            bestJobId: job.id,
            roleDistanceMiles: result.distanceMiles,
          }
        }
      }
      return {
        ...candidate,
        ...(best || {}),
        latitude: undefined,
        longitude: undefined,
        distance_miles: radiusResult.distanceMiles,
        distance_status: radiusResult.reason,
        within_radius: radiusResult.withinRadius,
      }
    })
    .filter((candidate: any) => candidate.within_radius)
    .sort((a: any, b: any) => {
      if (!!a.is_featured !== !!b.is_featured) return a.is_featured ? -1 : 1
      return (b.matchScore ?? -1) - (a.matchScore ?? -1)
    })

  const hasMore = discoverable.length > limit || (rows || []).length > limit
  const candidates = discoverable.slice(0, limit)

  return NextResponse.json({
    candidates,
    pagination: { limit, returned: candidates.length, has_more: hasMore },
    employer: { id: employer.id, company_name: employer.company_name, property_name: employer.property_name },
    origin: {
      postcode: employer.postcode || null,
      geocoded: employer.latitude != null && employer.longitude != null,
    },
    travel: travelAccessSummary(employer),
  })
}
