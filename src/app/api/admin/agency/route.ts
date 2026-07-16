import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin view of the agency money: every booking with its payment state
// (property paid in?) and payout state (therapist paid out?). WHC's margin
// per booking = 10% property fee + 5% therapist fee.

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const { data: bookings } = await admin.from('agency_bookings').select('*').order('created_at', { ascending: false })

    const empIds = Array.from(new Set((bookings || []).map(b => b.employer_id).filter(Boolean)))
    const candIds = Array.from(new Set((bookings || []).map(b => b.candidate_id).filter(Boolean)))
    const [emps, cands] = await Promise.all([
      empIds.length ? admin.from('employer_profiles').select('id, company_name, property_name').in('id', empIds) : Promise.resolve({ data: [] as any[] }),
      candIds.length ? admin.from('candidate_profiles').select('id, full_name, phone').in('id', candIds) : Promise.resolve({ data: [] as any[] }),
    ])
    const empMap = new Map((emps.data || []).map((e: any) => [e.id, e]))
    const candMap = new Map((cands.data || []).map((c: any) => [c.id, c]))

    const rows = (bookings || []).map(b => ({
      ...b,
      employer_name: empMap.get(b.employer_id)?.property_name || empMap.get(b.employer_id)?.company_name || 'Property',
      candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
      candidate_phone: candMap.get(b.candidate_id)?.phone || null,
    }))

    return NextResponse.json({ bookings: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    if (body.action !== 'mark_paid_out' || !body.bookingId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', body.bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (!booking.paid_at) return NextResponse.json({ error: 'The property has not paid for this booking yet.' }, { status: 400 })
    if (booking.payout_status === 'paid') return NextResponse.json({ error: 'Already marked as paid out.' }, { status: 400 })

    const { error } = await admin.from('agency_bookings')
      .update({ payout_status: 'paid', payout_at: new Date().toISOString() })
      .eq('id', booking.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
