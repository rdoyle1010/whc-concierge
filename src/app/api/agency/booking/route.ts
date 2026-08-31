import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { profileDistanceMiles } from '@/lib/geo'
import { getRequestUser } from '@/lib/request-user'
import { GET as legacyGET, POST } from './core'

export { POST }

const BOOKING_LIMIT = 100
const MAINTENANCE_INTERVAL_SECONDS = 300
const BOOKING_FIELDS = [
  'id', 'candidate_id', 'employer_id', 'shift_date', 'shift_start_time', 'shift_end_time',
  'shift_type', 'hours', 'rate', 'status', 'platform_fee', 'created_at', 'urgent', 'expires_at',
  'paid_at', 'amount_paid', 'payout_amount', 'payout_status', 'payout_at', 'dispute_status',
  'refund_amount', 'refunded_at', 'cascade_queue', 'cascade_index', 'cascade_deadline', 'cascade_notes', 'booking_group',
].join(',')

function employerDisplayName(emp: any) { return emp?.property_name || emp?.company_name || 'A property' }

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })
    const admin = createAdminClient()
    try { const { data: shouldSweep } = await admin.rpc('claim_maintenance_job', { p_job_key: 'agency_sweep', p_min_interval_seconds: MAINTENANCE_INTERVAL_SECONDS }); if (shouldSweep) await legacyGET() } catch (e: any) { console.error('Agency maintenance claim failed:', e?.message) }

    const [{ data: cand }, { data: emp }] = await Promise.all([
      admin.from('candidate_profiles').select('id, full_name, user_id, agency_available, agency_tier, agency_listed_until').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('id, company_name, property_name, user_id, preferred_employer, preferred_until').eq('user_id', user.id).maybeSingle(),
    ])

    const rows: any[] = []
    if (cand) { const { data } = await admin.from('agency_bookings').select(BOOKING_FIELDS).eq('candidate_id', cand.id).order('created_at', { ascending: false }).limit(BOOKING_LIMIT); rows.push(...(data || [])) }
    if (emp) { const { data } = await admin.from('agency_bookings').select(BOOKING_FIELDS).eq('employer_id', emp.id).order('created_at', { ascending: false }).limit(BOOKING_LIMIT); rows.push(...(data || [])) }

    const seen = new Set<string>(); const bookings = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    const empIds = Array.from(new Set(bookings.map(b => b.employer_id).filter(Boolean))); const candIds = Array.from(new Set(bookings.map(b => b.candidate_id).filter(Boolean)))

    const fetchEmployers = async (): Promise<{ data: any[] | null }> => {
      if (!empIds.length) return { data: [] }
      const full = await admin.from('employer_profiles').select('id, user_id, company_name, property_name, location, postcode, property_description, property_photos, review_score, review_count, star_rating, commute_car_required, nearest_transport, transport_walk_minutes, parking_available, taxi_support, taxi_notes, travel_notes, latitude, longitude').in('id', empIds)
      if (!full.error) return full
      return admin.from('employer_profiles').select('id, user_id, company_name, property_name, location, postcode, review_score, review_count').in('id', empIds)
    }
    const fetchCandidates = async (): Promise<{ data: any[] | null }> => {
      if (!candIds.length) return { data: [] }
      const full = await admin.from('candidate_profiles').select('id, user_id, full_name, latitude, longitude, travel_radius_miles').in('id', candIds)
      if (!full.error) return full
      return admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candIds)
    }

    const [empsRes, candsRes] = await Promise.all([fetchEmployers(), fetchCandidates()]); const empMap = new Map((empsRes.data || []).map((e: any) => [e.id, e])); const candMap = new Map((candsRes.data || []).map((c: any) => [c.id, c]))
    const bookingIds = bookings.map(b => b.id).filter(Boolean); let reviewedBookingIds = new Set<string>()
    if (bookingIds.length) { try { const { data: reviews } = await admin.from('reviews').select('booking_id').eq('reviewer_id', user.id).in('booking_id', bookingIds); reviewedBookingIds = new Set((reviews || []).map((r: any) => r.booking_id).filter(Boolean)) } catch {} }

    const enriched = bookings.map(b => {
      const employer = empMap.get(b.employer_id) || {}; const candidate = candMap.get(b.candidate_id) || {}; const dist = profileDistanceMiles(candidate, employer); const radius = candidate?.travel_radius_miles ?? null
      return {
        ...b, reviewed_by_viewer: reviewedBookingIds.has(b.id), distance_miles: dist != null ? Math.round(dist * 10) / 10 : null, candidate_travel_radius: radius, within_radius: dist != null && radius ? dist <= radius : null,
        employer_name: employerDisplayName(employer), employer_user_id: employer?.user_id || null, employer_location: employer?.location || null, employer_review_score: employer?.review_score ?? null, employer_review_count: employer?.review_count ?? null, employer_star_rating: employer?.star_rating ?? null, employer_postcode: employer?.postcode || null, employer_description: employer?.property_description || null, employer_photos: Array.isArray(employer?.property_photos) ? employer.property_photos : [],
        commute_car_required: employer?.commute_car_required ?? null, nearest_transport: employer?.nearest_transport || null, transport_walk_minutes: employer?.transport_walk_minutes ?? null, parking_available: employer?.parking_available ?? null, taxi_support: employer?.taxi_support ?? null, taxi_notes: employer?.taxi_notes || null, travel_notes: employer?.travel_notes || null,
        candidate_name: candidate?.full_name || 'Candidate', candidate_user_id: candidate?.user_id || null, cascade_total: Array.isArray(b.cascade_queue) ? b.cascade_queue.length : null, cascade_position: Array.isArray(b.cascade_queue) ? (b.cascade_index ?? 0) + 1 : null, viewer_role: emp && b.employer_id === emp.id ? 'employer' : 'candidate',
      }
    }).sort((a,b)=>new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime())

    return NextResponse.json({ bookings: enriched, viewer: { candidate: cand ? { id:cand.id, full_name:cand.full_name, agency_available:Boolean(cand.agency_available), agency_tier:cand.agency_tier||null, agency_listed_until:cand.agency_listed_until||null } : null, employer: emp ? { id:emp.id, company_name:emp.company_name, property_name:emp.property_name, preferred_employer:Boolean(emp.preferred_employer), preferred_until:emp.preferred_until||null } : null }, pagination: { limit_per_profile:BOOKING_LIMIT, returned:enriched.length, capped:(cand ? rows.filter(r=>r.candidate_id===cand.id).length>=BOOKING_LIMIT:false)||(emp ? rows.filter(r=>r.employer_id===emp.id).length>=BOOKING_LIMIT:false) } })
  } catch (e:any) { return NextResponse.json({ error:e.message }, { status:500 }) }
}
