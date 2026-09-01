import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { applyAgencyCaseAdjustment } from '@/lib/agency-case-adjustment'

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

  // The same function the webhook calls, so whichever of the two arrives
  // first applies the credit and the other is told it was already done.
  const result = await applyAgencyCaseAdjustment(admin, {
    caseId: String(meta.case_id || ''),
    bookingId: meta.booking_id ? String(meta.booking_id) : null,
    extra: Number(meta.extra || 0),
    fee: Number(meta.fee || 0),
    sessionId: session.id,
    actorUserId: user.id,
    actorRole: 'employer',
  })

  if (result.applied) {
    return NextResponse.json({ success: true, extra: result.extra, fee: result.fee, total: result.total, payout: result.payout })
  }
  if (result.reason === 'already_applied') return NextResponse.json({ success: true, alreadyConfirmed: true })
  if (result.reason === 'case_not_found') return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  if (result.reason === 'booking_not_found') return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  if (result.reason === 'invalid_amount') return NextResponse.json({ error: 'Invalid adjustment amount.' }, { status: 400 })
  return NextResponse.json({ error: result.message || 'The payment could not be recorded.' }, { status: 500 })
}
