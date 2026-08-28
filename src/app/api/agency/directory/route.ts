import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseAccountRole } from '@/lib/role-access'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'
import { validShiftWindow, windowCovers, windowsOverlap } from '@/lib/agency-time'
import { getRequestUser } from '@/lib/request-user'

export const dynamic = 'force-dynamic'

const SAFE_FIELDS = [
  'id', 'user_id', 'full_name', 'profile_image_url', 'role_level', 'headline',
  'bio', 'experience_years', 'location', 'postcode', 'services_offered',
  'product_houses', 'qualifications', 'systems_experience', 'review_score',
  'review_count', 'whc_verified', 'has_insurance', 'availability_status',
  'travel_availability', 'travel_radius_miles', 'hourly_rate', 'day_rate_min',
  'day_rate_max', 'agency_tier', 'is_featured', 'latitude', 'longitude',
  'approval_status', 'profile_visible', 'created_at',
  'agency_listed_until',
].join(',')

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
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
    .select('id, approval_status, latitude, longitude, postcode, agency_search_radius_miles')
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
  const radius = Number.isFinite(requestedRadius) && requestedRadius > 0
    ? Math.min(requestedRadius, 250)
    : (Number(employer?.agency_search_radius_miles) > 0 ? Number(employer?.agency_search_radius_miles) : null)

  if (!isAdmin && employer && radius != null && radius !== Number(employer.agency_search_radius_miles || 0)) {
    await admin.from('employer_profiles').update({ agency_search_radius_miles: radius }).eq('id', employer.id)
  }

  const shiftDate = req.nextUrl.searchParams.get('shiftDate') || ''
  const shiftStartTime = req.nextUrl.searchParams.get('shiftStartTime') || ''
  const shiftEndTime = req.nextUrl.searchParams.get('shiftEndTime') || ''
  const hasShiftSearch = Boolean(shiftDate || shiftStartTime || shiftEndTime)
  if (hasShiftSearch && !validShiftWindow(shiftDate, shiftStartTime, shiftEndTime)) {
    return NextResponse.json({ error: 'Choose a valid shift date, start time and finish time' }, { status: 400 })
  }
  if (!isAdmin && !radius) {
    return NextResponse.json({ error: 'Set a search radius before looking for Agency Talent.' }, { status: 400 })
  }

  const origin = {
    latitude: hasSearchPoint ? requestedLat : employer?.latitude,
    longitude: hasSearchPoint ? requestedLng : employer?.longitude,
  }
  if (!isAdmin && (origin.latitude == null || origin.longitude == null)) {
    return NextResponse.json({ error: 'Your property location must be mapped before Agency search can calculate real travel distance.' }, { status: 400 })
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
  const candidateIds = (data || []).map((row: any) => row.id)
  const [{ data: dayRows }, { data: windows }, { data: bookings }, { data: completedShifts }] = hasShiftSearch && candidateIds.length
    ? await Promise.all([
        admin.from('agency_availability').select('candidate_id, available').in('candidate_id', candidateIds).eq('date', shiftDate),
        admin.from('agency_availability_windows').select('candidate_id, start_time, end_time').in('candidate_id', candidateIds).eq('date', shiftDate),
        admin.from('agency_bookings').select('candidate_id, shift_start_time, shift_end_time').in('candidate_id', candidateIds).eq('shift_date', shiftDate).in('status', ['pending', 'countered', 'accepted', 'confirmed']),
        admin.from('agency_bookings').select('candidate_id').in('candidate_id', candidateIds).eq('status', 'completed'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
  const unavailableIds = new Set((dayRows || []).filter((row: any) => row.available === false).map((row: any) => row.candidate_id))
  const windowsByCandidate = new Map<string, any[]>()
  for (const window of windows || []) windowsByCandidate.set(window.candidate_id, [...(windowsByCandidate.get(window.candidate_id) || []), window])
  const bookingsByCandidate = new Map<string, any[]>()
  for (const booking of bookings || []) bookingsByCandidate.set(booking.candidate_id, [...(bookingsByCandidate.get(booking.candidate_id) || []), booking])
  const completedCount = new Map<string, number>()
  for (const booking of completedShifts || []) completedCount.set(booking.candidate_id, (completedCount.get(booking.candidate_id) || 0) + 1)

  const candidates = (data || [])
    .filter((candidate: any) => !candidate.agency_listed_until || new Date(candidate.agency_listed_until).getTime() >= Date.now())
    .filter((candidate: any) => isAdmin || canEmployerDiscoverCandidate(candidate, blockedIds))
    .map((candidate: any) => {
      const result = mutualRadiusResult(origin, candidate, radius)
      let availabilityMatch: 'confirmed' | 'already_booked' | 'unavailable' | 'not_confirmed' | null = null
      if (hasShiftSearch) {
        const candidateWindows = windowsByCandidate.get(candidate.id) || []
        const coversShift = candidateWindows.some((window: any) => windowCovers(
          String(window.start_time).slice(0, 5), String(window.end_time).slice(0, 5), shiftStartTime, shiftEndTime,
        ))
        const overlaps = (bookingsByCandidate.get(candidate.id) || []).some((booking: any) => {
          if (!booking.shift_start_time || !booking.shift_end_time) return true
          return windowsOverlap(String(booking.shift_start_time).slice(0, 5), String(booking.shift_end_time).slice(0, 5), shiftStartTime, shiftEndTime)
        })
        availabilityMatch = unavailableIds.has(candidate.id) ? 'unavailable'
          : overlaps ? 'already_booked'
          : coversShift ? 'confirmed'
          : 'not_confirmed'
      }
      const { latitude: _latitude, longitude: _longitude, postcode: _postcode, approval_status: _approval, profile_visible: _visible, agency_listed_until: _listedUntil, ...safe } = candidate
      return {
        ...safe,
        distance_miles: result.distanceMiles,
        within_radius: result.withinRadius,
        distance_status: result.reason,
        availability_match: availabilityMatch,
        completed_shift_count: completedCount.get(candidate.id) || 0,
      }
    })
    .filter((candidate: any) => isAdmin || candidate.within_radius)
    .filter((candidate: any) => !hasShiftSearch || candidate.availability_match === 'confirmed')
  if (id && candidates.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json(id ? { candidate: candidates[0] } : {
    candidates,
    origin: {
      postcode: employer?.postcode || null,
      geocoded: origin.latitude != null && origin.longitude != null,
      search_radius_miles: radius,
    },
    shift: hasShiftSearch ? { date: shiftDate, startTime: shiftStartTime, endTime: shiftEndTime } : null,
  })
}
