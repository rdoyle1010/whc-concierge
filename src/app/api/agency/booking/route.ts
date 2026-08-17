import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { profileDistanceMiles } from '@/lib/geo'
import { GET as legacyGET, POST } from './core'

export { POST }

const BOOKING_LIMIT = 100
const MAINTENANCE_INTERVAL_SECONDS = 300

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

function employerDisplayName(emp: any) {
  return emp?.property_name || emp?.company_name || 'A property'
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()

    // Only one Agency request across the whole platform may run the legacy
    // maintenance sweep inside a five-minute window. Ordinary page loads skip
    // it completely, which removes expiry/email housekeeping from the hot path.
    try {
      const { data: shouldSweep } = await admin.rpc('claim_maintenance_job', {
        p_job_key: 'agency_sweep',
        p_min_interval_seconds: MAINTENANCE_INTERVAL_SECONDS,
      })
      if (shouldSweep) await legacyGET()
    } catch (e: any) {
      console.error('Agency maintenance claim failed:', e?.message)
    }

    const [{ data: cand }, { data: emp }] = await Promise.all([
      admin.from('candidate_profiles').select('id, full_name, user_id').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('id, company_name, property_name, user_id').eq('user_id', user.id).maybeSingle(),
    ])

    const rows: any[] = []
    if (cand) {
      const { data } = await admin.from('agency_bookings')
        .select('*')
        .eq('candidate_id', cand.id)
        .order('created_at', { ascending: false })
        .limit(BOOKING_LIMIT)
      rows.push(...(data || []))
    }
    if (emp) {
      const { data } = await admin.from('agency_bookings')
        .select('*')
        .eq('employer_id', emp.id)
        .order('created_at', { ascending: false })
        .limit(BOOKING_LIMIT)
      rows.push(...(data || []))
    }

    const seen = new Set<string>()
    const bookings = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    const empIds = Array.from(new Set(bookings.map(b => b.employer_id).filter(Boolean)))
    const candIds = Array.from(new Set(bookings.map(b => b.candidate_id).filter(Boolean)))

    const fetchEmployers = async (): Promise<{ data: any[] | null }> => {
      if (!empIds.length) return { data: [] }
      const full = await admin.from('employer_profiles')
        .select('id, user_id, company_name, property_name, location, postcode, commute_car_required, nearest_transport, transport_walk_minutes, parking_available, taxi_support, taxi_notes, travel_notes, latitude, longitude, review_score, review_count')
        .in('id', empIds)
      if (!full.error) return full
      return admin.from('employer_profiles').select('id, user_id, company_name, property_name, location').in('id', empIds)
    }

    const fetchCandidates = async (): Promise<{ data: any[] | null }> => {
      if (!candIds.length) return { data: [] }
      const full = await admin.from('candidate_profiles')
        .select('id, user_id, full_name, latitude, longitude, travel_radius_miles')
        .in('id', candIds)
      if (!full.error) return full
      return admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candIds)
    }

    const [empsRes, candsRes] = await Promise.all([fetchEmployers(), fetchCandidates()])
    const empMap = new Map((empsRes.data || []).map((e: any) => [e.id, e]))
    const candMap = new Map((candsRes.data || []).map((c: any) => [c.id, c]))

    const enriched = bookings
      .map(b => {
        const dist = profileDistanceMiles(candMap.get(b.candidate_id) || {}, empMap.get(b.employer_id) || {})
        const radius = candMap.get(b.candidate_id)?.travel_radius_miles ?? null
        return {
          ...b,
          distance_miles: dist != null ? Math.round(dist * 10) / 10 : null,
          candidate_travel_radius: radius,
          within_radius: dist != null && radius ? dist <= radius : null,
          employer_name: employerDisplayName(empMap.get(b.employer_id)),
          employer_user_id: empMap.get(b.employer_id)?.user_id || null,
          employer_location: empMap.get(b.employer_id)?.location || null,
          employer_review_score: empMap.get(b.employer_id)?.review_score ?? null,
          employer_review_count: empMap.get(b.employer_id)?.review_count ?? null,
          employer_postcode: empMap.get(b.employer_id)?.postcode || null,
          commute_car_required: empMap.get(b.employer_id)?.commute_car_required ?? null,
          nearest_transport: empMap.get(b.employer_id)?.nearest_transport || null,
          transport_walk_minutes: empMap.get(b.employer_id)?.transport_walk_minutes ?? null,
          parking_available: empMap.get(b.employer_id)?.parking_available ?? null,
          taxi_support: empMap.get(b.employer_id)?.taxi_support ?? null,
          taxi_notes: empMap.get(b.employer_id)?.taxi_notes || null,
          travel_notes: empMap.get(b.employer_id)?.travel_notes || null,
          candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
          candidate_user_id: candMap.get(b.candidate_id)?.user_id || null,
          cascade_total: Array.isArray(b.cascade_queue) ? b.cascade_queue.length : null,
          cascade_position: Array.isArray(b.cascade_queue) ? (b.cascade_index ?? 0) + 1 : null,
          viewer_role: emp && b.employer_id === emp.id ? 'employer' : 'candidate',
        }
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    return NextResponse.json({
      bookings: enriched,
      pagination: {
        limit_per_profile: BOOKING_LIMIT,
        returned: enriched.length,
        capped: (cand ? rows.filter(r => r.candidate_id === cand.id).length >= BOOKING_LIMIT : false)
          || (emp ? rows.filter(r => r.employer_id === emp.id).length >= BOOKING_LIMIT : false),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
