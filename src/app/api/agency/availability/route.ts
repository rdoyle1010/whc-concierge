import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DATE_RE, validShiftWindow } from '@/lib/agency-time'

// Therapist availability calendar. Available dates now carry one or more
// private time windows; employers only receive a derived match status.
//   'available'   → explicit window(s)
//   'unavailable' → explicit no: never offered that day
//   (no row)      → availability not confirmed
// All writes via service role - RLS on agency_availability is locked down.

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    // Everything from today forward (past rows are irrelevant to the queue)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
    const [{ data, error }, { data: windows, error: windowError }] = await Promise.all([
      admin.from('agency_availability').select('date, available').eq('candidate_id', cand.id).gte('date', today),
      admin.from('agency_availability_windows').select('id, date, start_time, end_time, timezone').eq('candidate_id', cand.id).gte('date', today).order('start_time'),
    ])
    if (error || windowError) return NextResponse.json({ error: (error || windowError)?.message }, { status: 500 })
    return NextResponse.json({ days: data || [], windows: windows || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const body = await req.json()
    const date = String(body.date || '')
    const state = String(body.state || '')
    if (!DATE_RE.test(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    if (!['available', 'unavailable', 'clear'].includes(state)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
    }

    if (state === 'clear') {
      const [{ error }, { error: windowError }] = await Promise.all([
        admin.from('agency_availability').delete().eq('candidate_id', cand.id).eq('date', date),
        admin.from('agency_availability_windows').delete().eq('candidate_id', cand.id).eq('date', date),
      ])
      if (error || windowError) return NextResponse.json({ error: (error || windowError)?.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (state === 'available') {
      const startTime = String(body.startTime || '')
      const endTime = String(body.endTime || '')
      if (!validShiftWindow(date, startTime, endTime)) {
        return NextResponse.json({ error: 'Choose a valid start and finish time' }, { status: 400 })
      }
      const { error: windowError } = await admin.from('agency_availability_windows').upsert({
        candidate_id: cand.id, date, start_time: startTime, end_time: endTime,
        timezone: 'Europe/London', updated_at: new Date().toISOString(),
      }, { onConflict: 'candidate_id,date,start_time,end_time' })
      if (windowError) return NextResponse.json({ error: windowError.message }, { status: 500 })
    } else {
      const { error: windowError } = await admin.from('agency_availability_windows').delete().eq('candidate_id', cand.id).eq('date', date)
      if (windowError) return NextResponse.json({ error: windowError.message }, { status: 500 })
    }

    const { error } = await admin
      .from('agency_availability')
      .upsert({ candidate_id: cand.id, date, available: state === 'available' }, { onConflict: 'candidate_id,date' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
