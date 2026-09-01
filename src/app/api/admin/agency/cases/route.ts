import { NextRequest, NextResponse } from 'next/server'
import { agencyResolutionExceedsCollected } from '@/lib/agency-payouts'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: rows, error } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const candidateIds = Array.from(new Set((rows || []).map((r: any) => r.booking?.candidate_id).filter(Boolean)))
  const employerIds = Array.from(new Set((rows || []).map((r: any) => r.booking?.employer_id).filter(Boolean)))
  const caseIds = (rows || []).map((r: any) => r.id)
  const [{ data: candidates }, { data: employers }, { data: messages }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,full_name,user_id').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    employerIds.length ? admin.from('employer_profiles').select('id,property_name,company_name,user_id').in('id', employerIds) : Promise.resolve({ data: [] as any[] }),
    caseIds.length ? admin.from('agency_case_messages').select('*').in('case_id', caseIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
  ])
  const cm = new Map((candidates || []).map((x: any) => [x.id, x]))
  const em = new Map((employers || []).map((x: any) => [x.id, x]))
  const grouped = new Map<string, any[]>()
  for (const m of messages || []) grouped.set(m.case_id, [...(grouped.get(m.case_id) || []), m])
  return NextResponse.json({ cases: (rows || []).map((r: any) => ({
    ...r,
    candidate_name: cm.get(r.booking?.candidate_id)?.full_name || 'Professional',
    employer_name: em.get(r.booking?.employer_id)?.property_name || em.get(r.booking?.employer_id)?.company_name || 'Property',
    messages: grouped.get(r.id) || [],
  })) })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.caseId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const admin = createAdminClient()
  const { data: row } = await admin.from('agency_cases').select('*').eq('id', body.caseId).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', row.booking_id).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (body.action === 'message') {
    const message = String(body.message || '').trim()
    if (!message) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
    await admin.from('agency_case_messages').insert({ case_id: row.id, sender_user_id: user.id, sender_role: 'admin', message: message.slice(0, 4000) })
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: 'admin', event_type: 'admin_message_added' })
    return NextResponse.json({ success: true })
  }

  if (body.action !== 'resolve') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const refund = Math.max(0, Number(body.refundAmount || 0))
  const extra = Math.max(0, Number(body.extraAmount || 0))
  const currentPayout = Number(booking.payout_amount || ((booking.rate || 0) * (booking.hours || 8)))
  const adjustedPayout = body.adjustedPayoutAmount === '' || body.adjustedPayoutAmount == null ? currentPayout + extra : Math.max(0, Number(body.adjustedPayoutAmount))
  const resolution = String(body.resolution || '').trim().slice(0, 4000)
  if (!resolution) return NextResponse.json({ error: 'Add a proposed resolution.' }, { status: 400 })
  if (refund > Number(booking.amount_paid || 0)) return NextResponse.json({ error: 'Refund exceeds the amount collected.' }, { status: 400 })
  // The same invariant the admin dispute route enforces, and this one was
  // missing it: refund plus payout cannot exceed what the property actually
  // paid in. Without it an administrator could propose a full refund AND the
  // full shift value, both parties could sign, and WHC would pay the
  // professional out of its own money on top of refunding the property.
  //
  // The extra the property is being asked to pay counts as collected, since
  // the resolution only completes once that payment clears.
  if (agencyResolutionExceedsCollected(Number(booking.amount_paid || 0) + extra, refund, adjustedPayout)) {
    return NextResponse.json(
      { error: `The refund (£${refund.toFixed(2)}) plus the payout (£${adjustedPayout.toFixed(2)}) is more than the £${(Number(booking.amount_paid || 0) + extra).toFixed(2)} this booking will have collected. WHC cannot hand out more than it took in.` },
      { status: 400 },
    )
  }
  if (refund > 0 && (!booking.stripe_payment_intent || booking.stripe_payment_intent === 'manual_audit_no_charge')) return NextResponse.json({ error: 'This audit booking has no real Stripe payment to refund. Set the refund to £0 for this test case.' }, { status: 400 })

  const { error } = await admin.from('agency_cases').update({
    status: 'awaiting_agreement',
    proposed_resolution: resolution,
    proposed_refund_amount: refund,
    proposed_extra_amount: extra,
    proposed_payout_amount: adjustedPayout,
    admin_notes: String(body.adminNotes || '').trim().slice(0, 4000) || null,
    candidate_agreed_at: null,
    employer_agreed_at: null,
    candidate_agreed_by: null,
    employer_agreed_by: null,
  }).eq('id', row.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: 'admin', event_type: 'resolution_proposed', details: { refund, extra, adjusted_payout: adjustedPayout } })

  const [{ data: c }, { data: e }] = await Promise.all([
    admin.from('candidate_profiles').select('user_id').eq('id', booking.candidate_id).maybeSingle(),
    admin.from('employer_profiles').select('user_id').eq('id', booking.employer_id).maybeSingle(),
  ])
  await Promise.allSettled([
    c?.user_id ? createNotification(c.user_id, 'general', 'Agency case resolution ready', 'WHC has proposed a resolution. Please review the terms and sign if you agree.', '/talent/agency/cases') : Promise.resolve(),
    e?.user_id ? createNotification(e.user_id, 'general', 'Agency case resolution ready', 'WHC has proposed a resolution. Please review the terms and sign if you agree.', '/employer/agency/cases') : Promise.resolve(),
  ])
  return NextResponse.json({ success: true, awaitingAgreement: true })
}
