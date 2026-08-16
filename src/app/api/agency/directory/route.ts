import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normaliseAccountRole } from '@/lib/role-access'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'

export const dynamic = 'force-dynamic'

// Public directory data is explicitly selected and shaped here. Never expose
// candidate_profiles.select('*') to an anonymous browser: that table also
// contains CVs, telephone numbers, documents and exact coordinates.
const SAFE_FIELDS = [
  'id', 'user_id', 'full_name', 'profile_image_url', 'role_level', 'headline',
  'bio', 'experience_years', 'location', 'postcode', 'services_offered',
  'product_houses', 'qualifications', 'systems_experience', 'review_score',
  'review_count', 'whc_verified', 'has_insurance', 'availability_status',
  'travel_availability', 'travel_radius_miles', 'hourly_rate', 'day_rate_min',
  'day_rate_max', 'agency_tier', 'is_featured', 'latitude', 'longitude',
  'approval_status', 'profile_visible', 'created_at',
].join(',')

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in as a hotel or spa to search agency professionals', requires_sign_in: true }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = normaliseAccountRole(account?.role)
  const isAdmin = role === 'admin'
  if (!isAdmin && role !== 'employer') {
    return NextResponse.json({ error: 'An approved employer account is required' }, { status: 403 })
  }

  const { data: employer } = isAdmin ? { data: null } : await admin
    .from('employer_profiles')
    .select('id, approval_status, latitude, longitude, postcode')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!isAdmin && (!employer || employer.approval_status !== 'approved')) {
    return NextResponse.json({ error: 'Your employer account must be approved before viewing agency professionals' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  const latParam = req.nextUrl.searchParams.get('lat')
  const lngParam = req.nextUrl.searchParams.get('lng')
  const requestedLat = Number(latParam)
  const requestedLng = Number(lngParam)
  const requestedRadius = Number(req.nextUrl.searchParams.get('radius'))
  const hasSearchPoint = latParam != null && lngParam != null
    && Number.isFinite(requestedLat) && Number.isFinite(requestedLng)
  const radius = Number.isFinite(requestedRadius) && requestedRadius > 0 ? Math.min(requestedRadius, 250) : null
  const origin = {
    latitude: hasSearchPoint ? requestedLat : employer?.latitude,
    longitude: hasSearchPoint ? requestedLng : employer?.longitude,
  }

  let query = admin.from('candidate_profiles')
    .select(SAFE_FIELDS)
    .eq('approval_status', 'approved')
    .or('profile_visible.eq.true,profile_visible.is.null')
    .eq('agency_available', true)

  if (id) query = query.eq('id', id)
  const [{ data, error }, { data: blocks }] = await Promise.all([
    query
    .order('is_featured', { ascending: false })
    .order('review_score', { ascending: false }),
    employer
      ? admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id)
      : Promise.resolve({ data: [] as any[] }),
  ])

  if (error) return NextResponse.json({ error: 'Directory unavailable' }, { status: 500 })
  const blockedIds = new Set((blocks || []).map((row: any) => row.candidate_id))
  const candidates = (data || [])
    .filter((candidate: any) => isAdmin || canEmployerDiscoverCandidate(candidate, blockedIds))
    .map((candidate: any) => {
      const result = mutualRadiusResult(origin, candidate, radius)
      const { latitude: _latitude, longitude: _longitude, postcode: _postcode, approval_status: _approval, profile_visible: _visible, ...safe } = candidate
      return {
        ...safe,
        distance_miles: result.distanceMiles,
        within_radius: result.withinRadius,
        distance_status: result.reason,
      }
    })
    // A UK-wide search may remove the employer's radius, but it cannot widen
    // the professional's own travel commitment.
    .filter((candidate: any) => isAdmin || candidate.within_radius)
  if (id && candidates.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json(id ? { candidate: candidates[0] } : {
    candidates,
    origin: {
      postcode: employer?.postcode || null,
      geocoded: origin.latitude != null && origin.longitude != null,
    },
  })
}
