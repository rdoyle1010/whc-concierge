import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return store.getAll() }, setAll() {} } })
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const sessionId = String(body.sessionId || '')
  if (!sessionId) return NextResponse.json({ error: 'Missing payment session.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id,user_id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const meta = session.metadata || {}
  if (meta.type !== 'agency_case_adjustment' || meta.employer_id !== employer.id || session.payment_status !== 'paid') return NextResponse.json({ error: 'This payment could not be verified.' }, { status: 400 })

  const { data: row } = await admin.from('agency_cases').select('*').eq('id', meta.case_id).maybeSingle()
  if (!row || row.booking_id !== meta.booking_id) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  if (row.extra_payment_status === 'paid') return NextResponse.json({ success: true, alreadyConfirmed: true })

  const extra = Number(meta.extra || 0)
  const fee = Number(meta.fee || 0)
  if (extra <= 0) return NextResponse.json({ error: 'Invalid adjustment amount.' }, { status: 400 })
  const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', row.booking_id).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  const finalPayout = Number(row.adjusted_payout_amount || Number(booking.payout_amount || 0) + extra)
  const now = new Date().toISOString()
  const { error: bookingError } = await admin.from('agency_bookings').update({
    amount_paid: Number(booking.amount_paid || 0) + extra + fee,
    payout_amount: finalPayout,
    payout_status: 'pending',
    dispute_status: 'resolved',
  }).eq('id', booking.id)
  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 })

  const { error: caseError } = await admin.from('agency_cases').update({
    status: 'resolved',
    extra_payment_status: 'paid',
    extra_paid_at: now,
    resolved_at: now,
    extra_stripe_session_id: session.id,
  }).eq('id', row.id)
  if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 })

  await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: 'employer', event_type: 'extra_payment_received', details: { extra, fee, total: extra + fee, session_id: session.id } })
  return NextResponse.json({ success: true, extra, fee, total: extra + fee, payout: finalPayout })
}
