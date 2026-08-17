import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getStripe } from '@/lib/stripe'

// Admin view of the agency money: every booking with its payment state
// (property paid in?) and payout state (therapist paid out?). WHC's margin
// per booking = 10% property fee + 5% therapist fee.

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

    let referralCredits: any[] = []
    try {
      const { data: refs } = await admin.from('referrals')
        .select('id, referrer_candidate_id, referred_candidate_id, converted_at')
        .eq('status', 'converted').eq('credit_applied', false)
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
      const { data: enrols } = await admin.from('course_enrollments')
        .select('course_slug, amount_paid, paid_at, completed_at, candidate_id')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
      if (enrols) {
        const candIds2 = Array.from(new Set(enrols.slice(0, 12).map((e: any) => e.candidate_id)))
        const { data: names } = candIds2.length
          ? await admin.from('candidate_profiles').select('id, full_name').in('id', candIds2)
          : { data: [] as any[] }
        const nameMap = new Map((names || []).map((n: any) => [n.id, n.full_name]))
        academy = {
          revenue: enrols.reduce((s: number, e: any) => s + (e.amount_paid || 0), 0),
          enrolments: enrols.length,
          completions: enrols.filter((e: any) => e.completed_at).length,
          recent: enrols.slice(0, 12).map((e: any) => ({
            name: nameMap.get(e.candidate_id) || 'Therapist',
            course_slug: e.course_slug,
            amount_paid: e.amount_paid,
            paid_at: e.paid_at,
            completed: Boolean(e.completed_at),
          })),
        }
      }
    } catch { /* table not live yet */ }

    return NextResponse.json({ bookings: rows, referral_credits: referralCredits, academy })
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

    if (!['mark_paid_out', 'resolve_dispute'].includes(body.action) || !body.bookingId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', body.bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (body.action === 'mark_paid_out') {
      if (!booking.paid_at) return NextResponse.json({ error: 'The property has not paid for this booking yet.' }, { status: 400 })
      if (booking.payout_status === 'paid') return NextResponse.json({ error: 'Already marked as paid out.' }, { status: 400 })
      if (booking.dispute_status === 'open') return NextResponse.json({ error: 'This booking has an open dispute - resolve it before paying out.' }, { status: 400 })

      const { error } = await admin.from('agency_bookings')
        .update({ payout_status: 'paid', payout_at: new Date().toISOString() })
        .eq('id', booking.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (booking.dispute_status !== 'open') {
      return NextResponse.json({ error: 'No open dispute on this booking.' }, { status: 400 })
    }

    const refundAmount = Math.max(0, parseInt(String(body.refundAmount ?? 0), 10) || 0)
    const payoutAmount = Math.max(0, parseInt(String(body.payoutAmount ?? booking.payout_amount ?? 0), 10) || 0)
    const amountPaid = Math.max(0, Number(booking.amount_paid || 0))

    if (refundAmount > amountPaid) {
      return NextResponse.json({ error: `Refund cannot exceed the £${amountPaid} collected for this booking.` }, { status: 400 })
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

    return NextResponse.json({ success: true, refundId: stripeRefundId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
