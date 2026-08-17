import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canEmployerDiscoverCandidate, mutualRadiusResult, travelAccessSummary } from '@/lib/discovery'

export const dynamic = 'force-dynamic'

const EMPLOYER_CANDIDATE_FIELDS = [
  'id', 'user_id', 'full_name', 'headline', 'role_level', 'location', 'services_offered',
  'experience_years', 'profile_image_url', 'review_score', 'bio', 'qualifications',
  'product_houses', 'systems_experience', 'cv_url', 'has_insurance',
  'availability_status', 'travel_radius_miles', 'has_car', 'latitude', 'longitude',
  'approval_status', 'profile_visible', 'is_featured', 'featured_until', 'created_at',
].join(',')

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in as an employer' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin
    .from('employer_profiles')
    .select('id, approval_status, latitude, longitude, postcode, commute_car_required, nearest_transport, transport_walk_minutes, parking_available, taxi_support, taxi_notes, travel_notes')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
  if (employer.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Your employer account must be approved before viewing talent profiles' }, { status: 403 })
  }

  const requestedRadius = Number(req.nextUrl.searchParams.get('radius'))
  const radius = Number.isFinite(requestedRadius) && requestedRadius > 0 ? Math.min(requestedRadius, 250) : null

  const [{ data: blocks }, { data: rows, error }] = await Promise.all([
    admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
    admin.from('candidate_profiles')
      .select(EMPLOYER_CANDIDATE_FIELDS)
      .eq('approval_status', 'approved')
      .or('profile_visible.eq.true,profile_visible.is.null')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (error) return NextResponse.json({ error: 'Talent directory unavailable' }, { status: 500 })
  const blocked = new Set((blocks || []).map((row: any) => row.candidate_id))
  const origin = { latitude: employer.latitude, longitude: employer.longitude }
  const candidates = (rows || [])
    .filter((candidate: any) => canEmployerDiscoverCandidate(candidate, blocked))
    .map((candidate: any) => {
      const radiusResult = mutualRadiusResult(origin, candidate, radius)
      return {
        ...candidate,
        latitude: undefined,
        longitude: undefined,
        distance_miles: radiusResult.distanceMiles,
        distance_status: radiusResult.reason,
        within_radius: radiusResult.withinRadius,
      }
    })
    // "All distances" removes the employer's own search limit, but it must
    // never override the professional's stated travel radius.
    .filter((candidate: any) => candidate.within_radius)

  return NextResponse.json({
    candidates,
    origin: {
      postcode: employer.postcode || null,
      geocoded: employer.latitude != null && employer.longitude != null,
    },
    travel: travelAccessSummary(employer),
  })
}
