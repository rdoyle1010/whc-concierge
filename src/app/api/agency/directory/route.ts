import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseAccountRole } from '@/lib/role-access'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'
import { validShiftWindow, windowCovers, windowsOverlap } from '@/lib/agency-time'
import { getRequestUser } from '@/lib/request-user'
import { presentCandidateForEmployer } from '@/lib/private-mode'

export const dynamic = 'force-dynamic'

const SAFE_FIELDS = [
  'id', 'user_id', 'full_name', 'profile_image_url', 'role_level', 'headline',
  'bio', 'experience_years', 'location', 'postcode', 'services_offered',
  'product_houses', 'qualifications', 'systems_experience', 'review_score',
  'review_count', 'whc_verified', 'has_insurance', 'availability_status',
  'travel_availability', 'travel_radius_miles', 'hourly_rate', 'day_rate_min',
  'day_rate_max', 'agency_tier', 'is_featured', 'latitude', 'longitude',
  'approval_status', 'profile_visible', 'stealth_mode', 'show_first_name_only', 'created_at',
  'agency_listed_until', 'right_to_work_status', 'insurance_expiry_date',
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
  const radiusParam = req.nextUrl.searchParams.get('radius')
  // 'uk' is an explicit UK-wide search: no radius cap, no mandatory-radius
  // error, and the stored radius preference is left untouched.
  const ukWide = radiusParam === 'uk'
  const requestedRadius = Number(radiusParam)
  const hasSearchPoint = latParam != null && lngParam != null
    && Number.isFinite(requestedLat) && Number.isFinite(requestedLng)
  const radius = ukWide
    ? null
    : Number.isFinite(requestedRadius) && requestedRadius > 0
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
  if (!isAdmin && !ukWide && !radius) {
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
  const [{ data: dayRows }, { data: windows }, { data: bookings }] = hasShiftSearch && candidateIds.length
    ? await Promise.all([
        admin.from('agency_availability').select('candidate_id, available').in('candidate_id', candidateIds).eq('date', shiftDate),
        admin.from('agency_availability_windows').select('candidate_id, start_time, end_time').in('candidate_id', candidateIds).eq('date', shiftDate),
        admin.from('agency_bookings').select('candidate_id, shift_start_time, shift_end_time').in('candidate_id', candidateIds).eq('shift_date', shiftDate).in('status', ['pending', 'countered', 'accepted', 'confirmed']),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // Shift history and reliability travel on every card, not just shift
  // searches - a property is buying reduced risk, and a professional's
  // track record of honoured shifts is the evidence.
  const [{ data: completedShifts }, { data: candidateCancellations }] = candidateIds.length
    ? await Promise.all([
        admin.from('agency_bookings').select('candidate_id').in('candidate_id', candidateIds).eq('status', 'completed'),
        admin.from('agency_bookings').select('candidate_id').in('candidate_id', candidateIds).eq('status', 'cancelled').eq('cancellation_requested_by', 'candidate'),
      ])
    : [{ data: [] }, { data: [] }]
  const unavailableIds = new Set((dayRows || []).filter((row: any) => row.available === false).map((row: any) => row.candidate_id))
  const windowsByCandidate = new Map<string, any[]>()
  for (const window of windows || []) windowsByCandidate.set(window.candidate_id, [...(windowsByCandidate.get(window.candidate_id) || []), window])
  const bookingsByCandidate = new Map<string, any[]>()
  for (const booking of bookings || []) bookingsByCandidate.set(booking.candidate_id, [...(bookingsByCandidate.get(booking.candidate_id) || []), booking])
  const completedCount = new Map<string, number>()
  for (const booking of completedShifts || []) completedCount.set(booking.candidate_id, (completedCount.get(booking.candidate_id) || 0) + 1)
  const cancelledCount = new Map<string, number>()
  for (const booking of candidateCancellations || []) cancelledCount.set(booking.candidate_id, (cancelledCount.get(booking.candidate_id) || 0) + 1)

  // Private Career Mode. Looked up separately and tolerantly: the column
  // arrives with migration 20260831190000, and a directory must not break
  // before it runs. A failed read means nobody is treated as private, which
  // is the state the platform was already in.
  const privateIds = new Set<string>()
  try {
    const { data: privateRows, error: privateError } = await admin.from('candidate_profiles')
      .select('id').eq('private_mode', true)
    if (!privateError) for (const row of privateRows || []) privateIds.add(row.id)
  } catch { }

  const candidates = (data || [])
    .filter((candidate: any) => !candidate.agency_listed_until || new Date(candidate.agency_listed_until).getTime() >= Date.now())
    .filter((candidate: any) => isAdmin || canEmployerDiscoverCandidate(candidate, blockedIds))
    .map((candidate: any) => privateIds.has(candidate.id) ? { ...candidate, private_mode: true } : candidate)
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
      // Agency Ready: identity verified, insured (and not expired), right to
      // work verified, a rate set, and a mapped location. Computed here so
      // the raw compliance fields never leave the server.
      const insuranceCurrent = Boolean(candidate.has_insurance)
        && (!candidate.insurance_expiry_date || new Date(candidate.insurance_expiry_date).getTime() >= Date.now())
      const agencyReady = Boolean(candidate.whc_verified)
        && insuranceCurrent
        && candidate.right_to_work_status === 'verified'
        && Number(candidate.hourly_rate) > 0
        && candidate.latitude != null
      const completed = completedCount.get(candidate.id) || 0
      const cancelled = cancelledCount.get(candidate.id) || 0
      const { latitude: _latitude, longitude: _longitude, postcode: _postcode, approval_status: _approval, profile_visible: _visible, stealth_mode: _stealth, agency_listed_until: _listedUntil, right_to_work_status: _rtw, insurance_expiry_date: _insExpiry, ...safe } = candidate
      return {
        ...presentCandidateForEmployer(safe),
        distance_miles: result.distanceMiles,
        within_radius: result.withinRadius,
        distance_status: result.reason,
        availability_match: availabilityMatch,
        completed_shift_count: completed,
        agency_ready: agencyReady,
        // Reliability is only stated once there is a real track record.
        reliability_pct: completed + cancelled >= 3 ? Math.round((completed / (completed + cancelled)) * 100) : null,
      }
    })
    .filter((candidate: any) => isAdmin || candidate.within_radius)
    .filter((candidate: any) => !hasShiftSearch || candidate.availability_match === 'confirmed')
  if (id && candidates.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Reviews of a professional are private to their two parties in the
  // database. The agency profile page used to read them with the browser's
  // anon key; it now receives them here, already checked for an approved
  // employer viewer and shaped to rating, comment and date - never the
  // reviewer's identity.
  if (id) {
    const candidate = candidates[0]
    const { data: reviewRows } = await admin
      .from('reviews')
      .select('id,rating,text,criteria_scores,created_at')
      .eq('reviewee_id', candidate.user_id || candidate.id)
      .order('created_at', { ascending: false })
      .limit(100)
    const reviews = (reviewRows || []).filter((review: any) => Number(review.rating) >= 1 && Number(review.rating) <= 5)
    return NextResponse.json({ candidate, reviews })
  }

  return NextResponse.json({
    candidates,
    origin: {
      postcode: employer?.postcode || null,
      geocoded: origin.latitude != null && origin.longitude != null,
      search_radius_miles: radius,
    },
    shift: hasShiftSearch ? { date: shiftDate, startTime: shiftStartTime, endTime: shiftEndTime } : null,
  })
}
