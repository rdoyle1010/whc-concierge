import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getStripe } from '@/lib/stripe'

async function currentUser() {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return store.getAll() }, setAll() {} },
  })
  return (await client.auth.getUser()).data.user
}

async function partyContext(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const [{ data: candidate }, { data: employer }, { data: profile }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', userId).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', userId).maybeSingle(),
    admin.from('profiles').select('role').eq('id', userId).maybeSingle(),
  ])
  return { candidate, employer, profile }
}

function roleForCase(row: any, candidate: any, employer: any, profile: any): 'candidate'|'employer'|'admin'|null {
  if (profile?.role === 'admin') return 'admin'
  if (row.booking?.candidate_id === candidate?.id) return 'candidate'
  if (row.booking?.employer_id === employer?.id) return 'employer'
  return null
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const { candidate, employer, profile } = await partyContext(admin, user.id)
  // Non-admins get cases scoped to their own bookings, so a global cap can
  // never hide a user's case behind other people's newer ones.
  let cases: any[] = []
  if (profile?.role === 'admin') {
    const { data } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').order('created_at', { ascending: false }).limit(100)
    cases = data || []
  } else {
    const bookingIds: string[] = []
    if (candidate?.id) {
      const { data } = await admin.from('agency_bookings').select('id').eq('candidate_id', candidate.id)
      for (const row of data || []) bookingIds.push(row.id)
    }
    if (employer?.id) {
      const { data } = await admin.from('agency_bookings').select('id').eq('employer_id', employer.id)
      for (const row of data || []) bookingIds.push(row.id)
    }
    const uniqueIds = Array.from(new Set(bookingIds))
    for (let i = 0; i < uniqueIds.length; i += 200) {
      const { data } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').in('booking_id', uniqueIds.slice(i, i + 200)).order('created_at', { ascending: false }).limit(100)
      cases.push(...(data || []))
    }
    cases.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }
  const visible = cases.filter((row: any) => profile?.role === 'admin' || row.booking?.candidate_id === candidate?.id || row.booking?.employer_id === employer?.id)
  const ids = visible.map((x: any) => x.id)
  const { data: messages } = ids.length ? await admin.from('agency_case_messages').select('*').in('case_id', ids).order('created_at', { ascending: true }) : { data: [] as any[] }
  const grouped = new Map<string, any[]>()
  for (const message of messages || []) grouped.set(message.case_id, [...(grouped.get(message.case_id) || []), message])
  return NextResponse.json({ cases: visible.map((row: any) => ({ ...row, messages: grouped.get(row.id) || [] })) })
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  const { candidate, employer, profile } = await partyContext(admin, user.id)

  if (body.action === 'open') {
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', body.bookingId).maybeSingle()
    if (!booking || !['confirmed','completed'].includes(booking.status)) return NextResponse.json({ error: 'This shift cannot have a case opened yet.' }, { status: 400 })
    const role = booking.candidate_id === candidate?.id ? 'candidate' : booking.employer_id === employer?.id ? 'employer' : null
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const description = String(body.description || '').trim()
    if (description.length < 5) return NextResponse.json({ error: 'Please explain what happened.' }, { status: 400 })
    const { data: existing } = await admin.from('agency_cases').select('id').eq('booking_id', booking.id).in('status', ['open','awaiting_response','under_review','awaiting_agreement','awaiting_payment']).maybeSingle()
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

    const [{ data: bookingCandidate }, { data: bookingEmployer }] = await Promise.all([
      admin.from('candidate_profiles').select('user_id').eq('id', booking.candidate_id).maybeSingle(),
      admin.from('employer_profiles').select('user_id').eq('id', booking.employer_id).maybeSingle(),
    ])
    const otherUserId = role === 'candidate' ? bookingEmployer?.user_id : bookingCandidate?.user_id
    if (otherUserId) await createNotification(otherUserId, 'general', 'Agency shift issue raised', `An issue has been raised about the Agency shift on ${booking.shift_date || 'the agreed date'}. Please review it and give your response.`, role === 'candidate' ? '/employer/agency/cases' : '/talent/agency/cases')
    return NextResponse.json({ case: data })
  }

  const { data: row } = await admin.from('agency_cases').select('*, booking:agency_bookings(*)').eq('id', body.caseId).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  const role = roleForCase(row, candidate, employer, profile)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (body.action === 'respond') {
    if (row.opened_by_user_id === user.id && role !== 'admin') return NextResponse.json({ error: 'The other party needs to respond first.' }, { status: 400 })
    const response = String(body.response || '').trim()
    if (!response) return NextResponse.json({ error: 'Please add your response.' }, { status: 400 })
    await admin.from('agency_cases').update({ counterparty_response: response, counterparty_response_user_id: user.id, counterparty_responded_at: new Date().toISOString(), status: 'under_review' }).eq('id', row.id)
    await admin.from('agency_case_messages').insert({ case_id: row.id, sender_user_id: user.id, sender_role: role, message: response })
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: role, event_type: 'response_added' })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'message') {
    const message = String(body.message || '').trim()
    if (!message) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
    if (['resolved','rejected'].includes(row.status)) return NextResponse.json({ error: 'This case is closed.' }, { status: 400 })
    await admin.from('agency_case_messages').insert({ case_id: row.id, sender_user_id: user.id, sender_role: role, message: message.slice(0, 4000) })
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: role, event_type: 'message_added' })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'agree') {
    if (!['candidate','employer'].includes(role)) return NextResponse.json({ error: 'Only the professional and property can sign.' }, { status: 403 })
    if (row.status !== 'awaiting_agreement') return NextResponse.json({ error: 'There is no resolution waiting for agreement.' }, { status: 400 })
    const now = new Date().toISOString()
    const patch = role === 'candidate' ? { candidate_agreed_at: now, candidate_agreed_by: user.id } : { employer_agreed_at: now, employer_agreed_by: user.id }
    const { data: updated } = await admin.from('agency_cases').update(patch).eq('id', row.id).select('*').single()
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: role, event_type: 'resolution_signed' })

    const bothAgreed = Boolean(updated?.candidate_agreed_at && updated?.employer_agreed_at)
    if (!bothAgreed) return NextResponse.json({ success: true, bothAgreed: false })

    const refund = Number(updated?.proposed_refund_amount || 0)
    const extra = Number(updated?.proposed_extra_amount || 0)
    const payout = Number(updated?.proposed_payout_amount ?? row.booking?.payout_amount ?? 0)
    let refundId: string | null = null
    if (refund > 0) {
      if (!row.booking?.stripe_payment_intent || row.booking.stripe_payment_intent === 'manual_audit_no_charge') return NextResponse.json({ error: 'This audit booking has no real Stripe payment to refund. Ask WHC Admin to amend the proposal.' }, { status: 400 })
      const stripe = getStripe()
      const result = await stripe.refunds.create({ payment_intent: row.booking.stripe_payment_intent, amount: Math.round(refund * 100), reason: 'requested_by_customer', metadata: { whc_booking_id: row.booking.id, whc_case_id: row.id } }, { idempotencyKey: `agency-case-agreed-${row.id}-${Math.round(refund * 100)}` })
      refundId = result.id
    }

    await admin.from('agency_cases').update({
      resolution: updated?.proposed_resolution,
      approved_refund_amount: refund,
      approved_extra_amount: extra,
      adjusted_payout_amount: payout,
      extra_payment_status: extra > 0 ? 'pending' : 'none',
      status: extra > 0 ? 'awaiting_payment' : 'resolved',
      resolved_at: extra > 0 ? null : now,
    }).eq('id', row.id)
    await admin.from('agency_bookings').update({
      dispute_status: extra > 0 ? 'open' : 'resolved',
      refund_amount: refund || null,
      refunded_at: refund ? now : null,
      payout_amount: payout,
      payout_status: extra > 0 ? 'on_hold' : (payout > 0 ? 'pending' : 'cancelled'),
    }).eq('id', row.booking.id)
    await admin.from('agency_case_events').insert({ case_id: row.id, actor_user_id: user.id, actor_role: role, event_type: extra > 0 ? 'agreement_complete_extra_payment_due' : 'agreement_complete', details: { refund, extra, payout, refund_id: refundId } })
    return NextResponse.json({ success: true, bothAgreed: true, awaitingPayment: extra > 0 })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
