import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import {
  AGENCY_PAYOUT_CONNECT,
  AGENCY_PAYOUT_MANUAL,
  MIN_PAYOUT_REFERENCE_LENGTH,
  agencyResolutionExceedsCollected,
} from '@/lib/agency-payouts'

const BOOKING_LIMIT = 250
const REFERRAL_LIMIT = 100
const RECENT_ENROLMENT_LIMIT = 12

const BOOKING_LIST_FIELDS = 'id,employer_id,candidate_id,shift_date,shift_start_time,shift_end_time,rate,hours,status,created_at,paid_at,amount_paid,payout_amount,payout_status,payout_at,dispute_status,dispute_reason,dispute_requested,refund_amount,stripe_payment_intent'
const BOOKING_MONEY_FIELDS = 'id,employer_id,candidate_id,shift_date,shift_end_time,status,paid_at,amount_paid,payout_amount,payout_status,dispute_status,stripe_payment_intent'

// Which money model a booking used. payout_method is the record of truth once
// migration 20260901100000 is live. For a booking taken before that, ask
// Stripe: a destination charge carries transfer_data, a plain charge does
// not. Neither wrong answer is acceptable with real money - calling a
// destination charge "manual" pays the therapist twice - so an unreadable
// payment intent returns 'unknown' and the payout is refused rather than guessed.
async function bookingPayoutModel(booking: any): Promise<'stripe_connect' | 'manual' | 'unknown'> {
  if (booking?.payout_method === AGENCY_PAYOUT_CONNECT) return AGENCY_PAYOUT_CONNECT
  if (booking?.payout_method === AGENCY_PAYOUT_MANUAL) return AGENCY_PAYOUT_MANUAL
  if (!booking?.stripe_payment_intent) return AGENCY_PAYOUT_MANUAL
  try {
    const intent = await getStripe().paymentIntents.retrieve(String(booking.stripe_payment_intent))
    return (intent as any)?.transfer_data?.destination ? AGENCY_PAYOUT_CONNECT : AGENCY_PAYOUT_MANUAL
  } catch {
    return 'unknown'
  }
}

async function requireAdmin() {
  const cookieStore = await cookies()
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

function londonClockKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
}

function agencyShiftHasEnded(booking: any) {
  if (!booking?.shift_date) return false
  const end = String(booking.shift_end_time || '23:59:59').slice(0, 8)
  return `${booking.shift_date}T${end}` <= londonClockKey()
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const admin = createAdminClient()
    // payout_method / payout_reference arrive with migration 20260901100000;
    // the money view must still load before it has been run.
    let bookings: any[] | null = null
    let bookingsError: any = null
    ;({ data: bookings, error: bookingsError } = await admin.from('agency_bookings')
      .select(`${BOOKING_LIST_FIELDS},payout_method,payout_reference`)
      .order('created_at', { ascending: false })
      .limit(BOOKING_LIMIT))
    if (bookingsError) {
      ;({ data: bookings, error: bookingsError } = await admin.from('agency_bookings')
        .select(BOOKING_LIST_FIELDS)
        .order('created_at', { ascending: false })
        .limit(BOOKING_LIMIT))
    }
    if (bookingsError) return NextResponse.json({ error: bookingsError.message }, { status: 500 })

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
      payout_ready: Boolean(b.paid_at && b.payout_status !== 'paid' && b.dispute_status !== 'open' && agencyShiftHasEnded(b)),
      employer_name: empMap.get(b.employer_id)?.property_name || empMap.get(b.employer_id)?.company_name || 'Property',
      candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
      candidate_phone: candMap.get(b.candidate_id)?.phone || null,
    }))

    let referralCredits: any[] = []
    try {
      const { data: refs } = await admin.from('referrals')
        .select('id, referrer_candidate_id, referred_candidate_id, converted_at')
        .eq('status', 'converted')
        .eq('credit_applied', false)
        .order('converted_at', { ascending: false })
        .limit(REFERRAL_LIMIT)
      if (refs && refs.length) {
        const ids = Array.from(new Set(refs.flatMap((r: any) => [r.referrer_candidate_id, r.referred_candidate_id])))
        const { data: names } = await admin.from('candidate_profiles').select('id, full_name').in('id', ids)
        const nameMap = new Map((names || []).map((n: any) => [n.id, n.full_name]))
        referralCredits = refs.map((r: any) => ({
          id: r.id,
          referrer_name: nameMap.get(r.referrer_candidate_id) || 'Therapist',
          referred_name: nameMap.get(r.referred_candidate_id) || 'Therapist',
          converted_at: r.converted_at,
        }))
      }
    } catch { /* table not live yet */ }

    let academy: any = null
    try {
      const [{ data: allEnrols }, { data: recentEnrols }] = await Promise.all([
        admin.from('course_enrollments').select('amount_paid, paid_at, completed_at').not('paid_at', 'is', null),
        admin.from('course_enrollments')
          .select('course_slug, amount_paid, paid_at, completed_at, candidate_id')
          .not('paid_at', 'is', null)
          .order('paid_at', { ascending: false })
          .limit(RECENT_ENROLMENT_LIMIT),
      ])

      const summary = {
        revenue: (allEnrols || []).reduce((sum: number, row: any) => sum + Number(row.amount_paid || 0), 0),
        enrolments: (allEnrols || []).length,
        completions: (allEnrols || []).filter((row: any) => row.completed_at).length,
      }
      const candIds2 = Array.from(new Set((recentEnrols || []).map((e: any) => e.candidate_id).filter(Boolean)))
      const { data: names } = candIds2.length
        ? await admin.from('candidate_profiles').select('id, full_name').in('id', candIds2)
        : { data: [] as any[] }
      const nameMap = new Map((names || []).map((n: any) => [n.id, n.full_name]))

      academy = {
        revenue: Number(summary?.revenue || 0),
        enrolments: Number(summary?.enrolments || 0),
        completions: Number(summary?.completions || 0),
        recent: (recentEnrols || []).map((e: any) => ({
          name: nameMap.get(e.candidate_id) || 'Therapist',
          course_slug: e.course_slug,
          amount_paid: e.amount_paid,
          paid_at: e.paid_at,
          completed: Boolean(e.completed_at),
        })),
      }
    } catch { /* table/function not live yet */ }

    // The register itself: who is listed, who has set up but never joined,
    // and the reasons someone who thinks they are visible is not.
    let register: any[] = []
    try {
      const { data: regRows } = await admin.from('candidate_profiles')
        .select('id, full_name, agency_available, agency_tier, agency_listed_until, hourly_rate, postcode, travel_radius_miles, latitude, approval_status, profile_visible')
        .or('agency_available.eq.true,hourly_rate.not.is.null')
        .order('full_name')
        .limit(200)
      const regIds = (regRows || []).map((row: any) => row.id)
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
      const { data: windowRows } = regIds.length
        ? await admin.from('agency_availability_windows').select('candidate_id').in('candidate_id', regIds).gte('date', today)
        : { data: [] as any[] }
      const windowCount = new Map<string, number>()
      for (const row of windowRows || []) windowCount.set(row.candidate_id, (windowCount.get(row.candidate_id) || 0) + 1)
      register = (regRows || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        listed: Boolean(row.agency_available) && (!row.agency_listed_until || new Date(row.agency_listed_until).getTime() >= Date.now()),
        agency_tier: row.agency_tier || null,
        agency_listed_until: row.agency_listed_until || null,
        hourly_rate: row.hourly_rate || null,
        location_mapped: row.latitude != null,
        travel_radius_miles: row.travel_radius_miles || null,
        approved: row.approval_status === 'approved',
        visible: row.profile_visible !== false,
        upcoming_windows: windowCount.get(row.id) || 0,
      }))
    } catch { /* columns not live yet - panel simply not shown */ }

    return NextResponse.json({
      bookings: rows,
      referral_credits: referralCredits,
      academy,
      register,
      pagination: {
        bookings_limit: BOOKING_LIMIT,
        bookings_returned: rows.length,
        bookings_capped: rows.length >= BOOKING_LIMIT,
        referrals_limit: REFERRAL_LIMIT,
        referrals_returned: referralCredits.length,
        referrals_capped: referralCredits.length >= REFERRAL_LIMIT,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()

    if (body.action === 'referral_credit_applied' && body.referralId) {
      const adminC = createAdminClient()
      const { error } = await adminC.from('referrals')
        .update({ credit_applied: true })
        .eq('id', body.referralId).eq('status', 'converted')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // List or delist a professional on the register without a charge - for
    // testing, goodwill or comped listings. Clearly labelled in the UI so it
    // is never mistaken for the paid route.
    if (body.action === 'register_list' && body.candidateId) {
      const adminC = createAdminClient()
      const { error } = await adminC.from('candidate_profiles')
        .update({
          agency_available: true,
          agency_tier: 'basic',
          agency_listed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', body.candidateId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (body.action === 'register_delist' && body.candidateId) {
      const adminC = createAdminClient()
      const { error } = await adminC.from('candidate_profiles')
        .update({ agency_available: false, agency_listed_until: null })
        .eq('id', body.candidateId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (!['mark_paid_out', 'resolve_dispute'].includes(body.action) || !body.bookingId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()
    // payout_method / payout_reference arrive with migration 20260901100000;
    // fall back to the pre-migration column set so payouts never block.
    let booking: any = null
    let bookingError: any = null
    ;({ data: booking, error: bookingError } = await admin.from('agency_bookings')
      .select(`${BOOKING_MONEY_FIELDS},payout_method,payout_reference`)
      .eq('id', body.bookingId)
      .maybeSingle())
    if (bookingError) {
      ;({ data: booking, error: bookingError } = await admin.from('agency_bookings')
        .select(BOOKING_MONEY_FIELDS)
        .eq('id', body.bookingId)
        .maybeSingle())
    }
    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (body.action === 'mark_paid_out') {
      if (!booking.paid_at) return NextResponse.json({ error: 'The property has not paid for this booking yet.' }, { status: 400 })
      if (!agencyShiftHasEnded(booking)) return NextResponse.json({ error: 'This shift has not finished yet. Therapist payout is only released after the scheduled end time.' }, { status: 400 })
      if (booking.payout_status === 'paid') return NextResponse.json({ error: 'Already marked as paid out.' }, { status: 400 })
      if (booking.dispute_status === 'open') return NextResponse.json({ error: 'This booking has an open dispute - resolve it before paying out.' }, { status: 400 })

      const payoutModel = await bookingPayoutModel(booking)
      if (payoutModel === 'unknown') {
        return NextResponse.json({ error: 'Stripe could not confirm how this booking was paid, so the payout has not been recorded. Try again in a moment rather than transferring anything.' }, { status: 502 })
      }
      const paidByConnect = payoutModel === AGENCY_PAYOUT_CONNECT
      const payoutReference = String(body.payoutReference || '').trim().slice(0, 140)

      // A manual payout can no longer be recorded with nothing behind it: the
      // bank reference for the transfer that actually left the account is
      // required, and stored alongside the admin who confirmed it.
      if (!paidByConnect && payoutReference.length < MIN_PAYOUT_REFERENCE_LENGTH) {
        return NextResponse.json({ error: `Enter the bank transfer reference (at least ${MIN_PAYOUT_REFERENCE_LENGTH} characters) for the payment you have made to the therapist. A payout cannot be marked paid without one.` }, { status: 400 })
      }

      const payoutAt = new Date().toISOString()
      const baseUpdate = { payout_status: 'paid', payout_at: payoutAt, status: 'completed' }
      const fullUpdate: Record<string, any> = {
        ...baseUpdate,
        // A destination charge already moved this money at payment. Recording
        // it here completes the record; it does not pay anyone a second time.
        payout_method: paidByConnect ? AGENCY_PAYOUT_CONNECT : AGENCY_PAYOUT_MANUAL,
        payout_reference: paidByConnect ? null : payoutReference,
        payout_confirmed_by: user.id,
      }
      let { error } = await admin.from('agency_bookings').update(fullUpdate).eq('id', booking.id)
      if (error && /column|payout_method|payout_reference|payout_confirmed_by/i.test(error.message || '')) {
        // Integrity columns not live yet - record the status honestly anyway.
        ;({ error } = await admin.from('agency_bookings').update(baseUpdate).eq('id', booking.id))
      }
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, payout_method: paidByConnect ? AGENCY_PAYOUT_CONNECT : AGENCY_PAYOUT_MANUAL })
    }

    if (booking.dispute_status !== 'open') {
      return NextResponse.json({ error: 'No open dispute on this booking.' }, { status: 400 })
    }

    const refundAmount = Math.max(0, parseInt(String(body.refundAmount ?? 0), 10) || 0)
    const payoutAmount = Math.max(0, parseInt(String(body.payoutAmount ?? booking.payout_amount ?? 0), 10) || 0)
    const amountPaid = Math.max(0, Number(booking.amount_paid || 0))
    const resolutionReason = String(body.reason || '').trim().slice(0, 1000)

    if (refundAmount > amountPaid) {
      return NextResponse.json({ error: `Refund cannot exceed the £${amountPaid} collected for this booking.` }, { status: 400 })
    }
    // Money invariant: WHC can never pay out more than it took in. The refund
    // to the property plus the payout to the therapist must fit inside it.
    if (agencyResolutionExceedsCollected(amountPaid, refundAmount, payoutAmount)) {
      return NextResponse.json({ error: `A £${refundAmount} refund plus a £${payoutAmount} therapist payout comes to £${refundAmount + payoutAmount}, more than the £${amountPaid} collected for this booking. Lower one of them before resolving.` }, { status: 400 })
    }

    let stripeRefundId: string | null = null
    if (refundAmount > 0) {
      if (!booking.stripe_payment_intent) {
        return NextResponse.json({ error: 'This booking has no Stripe payment reference, so an automatic refund cannot be issued.' }, { status: 400 })
      }
      try {
        const stripe = getStripe()
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent,
          amount: refundAmount * 100,
          reason: 'requested_by_customer',
          metadata: {
            whc_booking_id: booking.id,
            whc_dispute_resolution: 'true',
          },
        }, {
          idempotencyKey: `agency-dispute-${booking.id}-${refundAmount}`,
        })
        stripeRefundId = refund.id
      } catch (e: any) {
        console.error('Stripe agency refund failed:', e?.message)
        return NextResponse.json({ error: 'Stripe could not issue the refund. Nothing has been marked refunded - please try again.' }, { status: 502 })
      }
    }

    const { error } = await admin.from('agency_bookings')
      .update({
        dispute_status: 'resolved',
        refund_amount: refundAmount > 0 ? refundAmount : null,
        refunded_at: refundAmount > 0 ? new Date().toISOString() : null,
        payout_amount: payoutAmount,
        payout_status: payoutAmount > 0 ? (booking.payout_status === 'paid' ? 'paid' : 'pending') : 'cancelled',
      })
      .eq('id', booking.id)
    if (error) {
      console.error('Agency dispute DB update failed after Stripe action:', error.message, stripeRefundId)
      return NextResponse.json({ error: 'The Stripe refund may have been issued, but the booking record could not be updated. Check Stripe before retrying.' }, { status: 500 })
    }

    try {
      const [{ data: bEmp }, { data: bCand }] = await Promise.all([
        admin.from('employer_profiles').select('user_id, property_name, company_name').eq('id', booking.employer_id).maybeSingle(),
        admin.from('candidate_profiles').select('user_id, full_name').eq('id', booking.candidate_id).maybeSingle(),
      ])
      const { createNotification } = await import('@/lib/notifications')
      const when = booking.shift_date || 'the agreed date'
      if (bEmp?.user_id) {
        await createNotification(bEmp.user_id, 'general', 'Booking issue resolved',
          refundAmount > 0
            ? `WHC has resolved the issue on the ${when} shift. A refund of £${refundAmount} has been issued.`
            : `WHC has resolved the issue on the ${when} shift. No refund was agreed on this occasion.`,
          '/employer/agency')
      }
      if (bCand?.user_id) {
        await createNotification(bCand.user_id, 'general', 'Booking issue resolved',
          payoutAmount > 0
            ? `The issue on the ${when} shift has been resolved. Your payout has been set at £${payoutAmount}.`
            : `The issue on the ${when} shift has been resolved. No payout is due for this booking.`,
          '/talent/agency')
      }
    } catch { /* non-fatal */ }

    // Audit trail: attach the money decision to this booking's case so the
    // resolution can be explained months later. Never breaks the resolution.
    try {
      const { data: caseRow } = await admin.from('agency_cases')
        .select('id')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (caseRow?.id) {
        await admin.from('agency_case_events').insert({
          case_id: caseRow.id,
          actor_user_id: user.id,
          actor_role: 'admin',
          event_type: 'admin_dispute_resolved',
          details: {
            amount_paid: amountPaid,
            refund_amount: refundAmount,
            payout_amount: payoutAmount,
            retained_by_whc: amountPaid - refundAmount - payoutAmount,
            reason: resolutionReason || null,
            stripe_refund_id: stripeRefundId,
          },
        })
      }
    } catch (auditError: any) {
      console.error('Agency dispute audit event failed (non-fatal):', auditError?.message)
    }

    return NextResponse.json({ success: true, refundId: stripeRefundId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
