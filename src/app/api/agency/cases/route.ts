import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

async function currentUser() {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return store.getAll() }, setAll() {} },
  })
  return (await client.auth.getUser()).data.user
}

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }, { data: profile }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])
  const { data: cases } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').order('created_at', { ascending: false }).limit(100)
  const visible = (cases || []).filter((row: any) => profile?.role === 'admin' || row.booking?.candidate_id === candidate?.id || row.booking?.employer_id === employer?.id)
  return NextResponse.json({ cases: visible })
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }, { data: profile }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])

  if (body.action === 'open') {
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', body.bookingId).maybeSingle()
    if (!booking || !['confirmed','completed'].includes(booking.status)) return NextResponse.json({ error: 'This shift cannot have a case opened yet.' }, { status: 400 })
    const role = booking.candidate_id === candidate?.id ? 'candidate' : booking.employer_id === employer?.id ? 'employer' : null
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const description = String(body.description || '').trim()
    if (description.length < 5) return NextResponse.json({ error: 'Please explain what happened.' }, { status: 400 })
    const { data: existing } = await admin.from('agency_cases').select('id').eq('booking_id', booking.id).in('status', ['open','awaiting_response','under_review','awaiting_payment']).maybeSingle()
    if (existing) return NextResponse.json({ error: 'There is already an open case for this shift.' }, { status: 409 })
    const { data, error } = await admin.from('agency_cases').insert({
      booking_id: booking.id,
      opened_by_user_id: user.id,
      opened_by_role: role,
      issue_type: String(body.issueType || 'other'),
      description,
      actual_start_time: body.actualStartTime || null,
      actual_end_time: body.actualEndTime || null,
      requested_adjustment_type: ['refund','additional_payment'].includes(body.requestedAdjustmentType) ? body.requestedAdjustmentType : 'none',
      requested_amount: body.requestedAmount ? Number(body.requestedAmount) : null,
      requested_reason: String(body.requestedReason || '').trim() || null,
      status: 'awaiting_response',
    }).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not open this case.' }, { status: 500 })
    await admin.from('agency_bookings').update({ dispute_status: 'open', payout_status: 'on_hold', dispute_reason: description }).eq('id', booking.id)
    await admin.from('agency_case_events').insert({ case_id: data.id, actor_user_id: user.id, actor_role: role, event_type: 'case_opened' })
    return NextResponse.json({ case: data })
  }

  if (body.action === 'respond') {
    const { data: row } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').eq('id', body.caseId).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    const allowed = profile?.role === 'admin' || row.booking?.candidate_id === candidate?.id || row.booking?.employer_id === employer?.id
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (row.opened_by_user_id === user.id && profile?.role !== 'admin') return NextResponse.json({ error: 'The other party needs to respond.' }, { status: 400 })
    const response = String(body.response || '').trim()
    if (!response) return NextResponse.json({ error: 'Please add your response.' }, { status: 400 })
    const { data } = await admin.from('agency_cases').update({ counterparty_response: response, counterparty_response_user_id: user.id, counterparty_responded_at: new Date().toISOString(), status: 'under_review' }).eq('id', row.id).select('*').single()
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: profile?.role === 'admin' ? 'admin' : (row.booking?.candidate_id === candidate?.id ? 'candidate' : 'employer'), event_type: 'response_added' })
    return NextResponse.json({ case: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
