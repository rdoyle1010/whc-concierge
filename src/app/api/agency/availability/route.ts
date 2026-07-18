import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Therapist availability calendar. Three states per date:
//   'available'   → explicit yes: front of the urgent-cascade queue
//   'unavailable' → explicit no: never offered that day
//   (no row)      → unspecified: still eligible, ranked after explicit yes
// All writes via service role - RLS on agency_availability is locked down.

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    // Everything from today forward (past rows are irrelevant to the queue)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
    const { data, error } = await admin
      .from('agency_availability')
      .select('date, available')
      .eq('candidate_id', cand.id)
      .gte('date', today)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ days: data || [] })
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
      const { error } = await admin.from('agency_availability').delete().eq('candidate_id', cand.id).eq('date', date)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
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
