import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

async function requireAdmin() {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return store.getAll() }, setAll() {} } })
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: rows, error } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const candidateIds = Array.from(new Set((rows || []).map((r: any) => r.booking?.candidate_id).filter(Boolean)))
  const employerIds = Array.from(new Set((rows || []).map((r: any) => r.booking?.employer_id).filter(Boolean)))
  const [{ data: candidates }, { data: employers }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,full_name').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    employerIds.length ? admin.from('employer_profiles').select('id,property_name,company_name').in('id', employerIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const cm = new Map((candidates || []).map((x: any) => [x.id, x.full_name]))
  const em = new Map((employers || []).map((x: any) => [x.id, x.property_name || x.company_name]))
  return NextResponse.json({ cases: (rows || []).map((r: any) => ({ ...r, candidate_name: cm.get(r.booking?.candidate_id) || 'Professional', employer_name: em.get(r.booking?.employer_id) || 'Property' })) })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.action !== 'resolve' || !body.caseId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const admin = createAdminClient()
  const { data: row } = await admin.from('agency_cases').select('*').eq('id', body.caseId).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', row.booking_id).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const refund = Math.max(0, Number(body.refundAmount || 0))
  const extra = Math.max(0, Number(body.extraAmount || 0))
  const currentPayout = Number(booking.payout_amount || ((booking.rate || 0) * (booking.hours || 8)))
  const adjustedPayout = body.adjustedPayoutAmount === '' || body.adjustedPayoutAmount == null ? currentPayout + extra : Math.max(0, Number(body.adjustedPayoutAmount))
  const resolution = String(body.resolution || '').trim().slice(0, 4000)
  if (!resolution) return NextResponse.json({ error: 'Add a resolution note.' }, { status: 400 })
  if (refund > Number(booking.amount_paid || 0)) return NextResponse.json({ error: 'Refund exceeds the amount collected.' }, { status: 400 })

  let refundId: string | null = null
  if (refund > 0) {
    if (!booking.stripe_payment_intent || booking.stripe_payment_intent === 'manual_audit_no_charge') return NextResponse.json({ error: 'This booking has no refundable Stripe payment.' }, { status: 400 })
    try {
      const stripe = getStripe()
      const result = await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent, amount: Math.round(refund * 100), reason: 'requested_by_customer', metadata: { whc_booking_id: booking.id, whc_case_id: row.id } }, { idempotencyKey: `agency-case-${row.id}-${Math.round(refund * 100)}` })
      refundId = result.id
    } catch {
      return NextResponse.json({ error: 'Stripe could not issue the refund. Nothing was changed.' }, { status: 502 })
    }
  }

  const awaitingPayment = extra > 0
  const now = new Date().toISOString()
  const { error: caseError } = await admin.from('agency_cases').update({
    status: awaitingPayment ? 'awaiting_payment' : 'resolved',
    resolution,
    admin_notes: String(body.adminNotes || '').trim().slice(0, 4000) || null,
    approved_refund_amount: refund,
    approved_extra_amount: extra,
    adjusted_payout_amount: adjustedPayout,
    extra_payment_status: awaitingPayment ? 'pending' : 'none',
    resolved_at: awaitingPayment ? null : now,
  }).eq('id', row.id)
  if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 })

  const { error: bookingError } = await admin.from('agency_bookings').update({
    dispute_status: awaitingPayment ? 'open' : 'resolved',
    refund_amount: refund || null,
    refunded_at: refund ? now : null,
    payout_amount: adjustedPayout,
    payout_status: awaitingPayment ? 'on_hold' : (adjustedPayout > 0 ? 'pending' : 'cancelled'),
  }).eq('id', booking.id)
  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 })

  await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: 'admin', event_type: awaitingPayment ? 'extra_payment_approved' : 'case_resolved', details: { refund, extra, adjusted_payout: adjustedPayout, refund_id: refundId } })
  return NextResponse.json({ success: true, refundId, awaitingPayment })
}
