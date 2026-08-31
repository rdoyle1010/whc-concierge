import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'

async function requireAdmin() {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin' ? user : null
}

function londonDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function payoutReady(booking: any) {
  return Boolean(
    booking?.paid_at &&
    booking?.end_date &&
    booking.end_date < londonDate() &&
    ['confirmed', 'completed'].includes(booking.status) &&
    booking.payout_status !== 'paid' &&
    booking.dispute_status !== 'open'
  )
}

async function notifyParties(admin: any, booking: any, title: string, candidateMessage: string, employerMessage: string) {
  try {
    const [{ data: candidate }, { data: employer }] = await Promise.all([
      admin.from('candidate_profiles').select('user_id').eq('id', booking.candidate_id).maybeSingle(),
      admin.from('employer_profiles').select('user_id').eq('id', booking.employer_id).maybeSingle(),
    ])
    if (candidate?.user_id) await createNotification(candidate.user_id, 'general', title, candidateMessage, '/talent/residency')
    if (employer?.user_id) await createNotification(employer.user_id, 'general', title, employerMessage, '/employer/residency')
  } catch { /* notification failure is non-fatal */ }
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: bookings, error } = await admin.from('residency_bookings')
    .select('id,candidate_id,employer_id,property_name,start_date,end_date,days_required,agreed_day_rate,agreed_total,proposed_total,platform_fee,amount_paid,payout_amount,payout_status,payout_at,status,paid_at,dispute_status,dispute_reason,refund_amount,refunded_at,stripe_payment_intent,created_at')
    .order('created_at', { ascending: false })
    .limit(250)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const candidateIds = Array.from(new Set((bookings || []).map(row => row.candidate_id).filter(Boolean)))
  const employerIds = Array.from(new Set((bookings || []).map(row => row.employer_id).filter(Boolean)))
  const [{ data: candidates }, { data: employers }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,full_name').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    employerIds.length ? admin.from('employer_profiles').select('id,property_name,company_name').in('id', employerIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const candidateMap = new Map((candidates || []).map((row: any) => [row.id, row.full_name]))
  const employerMap = new Map((employers || []).map((row: any) => [row.id, row.property_name || row.company_name]))

  const rows = (bookings || []).map(booking => ({
    ...booking,
    candidate_name: candidateMap.get(booking.candidate_id) || 'Specialist',
    employer_name: employerMap.get(booking.employer_id) || booking.property_name || 'Property',
    payout_ready: payoutReady(booking),
  }))

  return NextResponse.json({ bookings: rows })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.bookingId || !['mark_paid_out', 'open_dispute', 'resolve_dispute'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: booking, error } = await admin.from('residency_bookings')
    .select('id,candidate_id,employer_id,property_name,start_date,end_date,status,paid_at,amount_paid,payout_amount,payout_status,dispute_status,stripe_payment_intent')
    .eq('id', body.bookingId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!booking) return NextResponse.json({ error: 'Residency booking not found' }, { status: 404 })

  if (body.action === 'mark_paid_out') {
    if (!payoutReady(booking)) {
      return NextResponse.json({ error: 'Payout is only available after the paid Residency has ended and no dispute is open.' }, { status: 400 })
    }

    // Real payout when the specialist has an active Stripe Connect account;
    // manual settlement recorded honestly otherwise.
    let payoutMethod: 'stripe' | 'manual' = 'manual'
    let transferId: string | null = null
    const payoutPounds = Number(booking.payout_amount || 0)
    try {
      const { data: payee } = await admin.from('candidate_profiles')
        .select('stripe_connect_account_id,connect_payouts_enabled')
        .eq('id', booking.candidate_id).maybeSingle()
      if (payee?.stripe_connect_account_id && payee.connect_payouts_enabled && payoutPounds > 0) {
        const stripe = getStripe()
        const transfer = await stripe.transfers.create({
          amount: Math.round(payoutPounds * 100),
          currency: 'gbp',
          destination: payee.stripe_connect_account_id,
          transfer_group: `residency_${booking.id}`,
          metadata: { type: 'residency_payout', booking_id: booking.id, candidate_id: booking.candidate_id },
        }, { idempotencyKey: `residency-payout-${booking.id}` })
        payoutMethod = 'stripe'
        transferId = transfer.id
      }
    } catch (transferError: any) {
      return NextResponse.json({ error: `Stripe transfer failed: ${transferError?.message || 'unknown error'}. Nothing was recorded - fix the issue or settle manually and try again.` }, { status: 502 })
    }

    const { error: updateError } = await admin.from('residency_bookings')
      .update({ payout_status: 'paid', payout_at: new Date().toISOString(), status: 'completed', payout_method: payoutMethod, stripe_transfer_id: transferId })
      .eq('id', booking.id)
    if (updateError) {
      if (transferId) return NextResponse.json({ error: `The Stripe transfer ${transferId} was sent but the record could not be updated: ${updateError.message}. Check Stripe before retrying.` }, { status: 500 })
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    await notifyParties(admin, booking,
      'Residency payout completed',
      payoutMethod === 'stripe' ? `Your residency payout of £${payoutPounds.toLocaleString('en-GB')} has been sent to your connected bank account. It typically arrives within 2-3 working days.` : 'Your Residency payout has been marked as paid.',
      'The specialist payout for this Residency has been completed.')
    return NextResponse.json({ success: true, payout_method: payoutMethod, transfer_id: transferId })
  }

  if (body.action === 'open_dispute') {
    if (!booking.paid_at) return NextResponse.json({ error: 'Only paid Residency bookings can enter dispute review.' }, { status: 400 })
    if (booking.payout_status === 'paid') return NextResponse.json({ error: 'This payout has already been marked paid.' }, { status: 400 })
    const reason = String(body.reason || '').trim().slice(0, 1000)
    if (!reason) return NextResponse.json({ error: 'Add a reason for the dispute.' }, { status: 400 })
    const { error: updateError } = await admin.from('residency_bookings')
      .update({ dispute_status: 'open', dispute_reason: reason })
      .eq('id', booking.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    await notifyParties(admin, booking, 'Residency booking under review', 'Spa Platform is reviewing an issue with this Residency. Payout is on hold while it is reviewed.', 'Spa Platform is reviewing an issue with this Residency. Specialist payout is on hold while it is reviewed.')
    return NextResponse.json({ success: true })
  }

  if (booking.dispute_status !== 'open') return NextResponse.json({ error: 'There is no open dispute on this booking.' }, { status: 400 })

  const refundAmount = Math.max(0, Number(body.refundAmount || 0))
  const payoutAmount = Math.max(0, Number(body.payoutAmount ?? booking.payout_amount ?? 0))
  const collected = Math.max(0, Number(booking.amount_paid || 0))
  if (refundAmount > collected) return NextResponse.json({ error: 'Refund cannot exceed the amount collected.' }, { status: 400 })

  let refundId: string | null = null
  if (refundAmount > 0) {
    if (!booking.stripe_payment_intent) return NextResponse.json({ error: 'No Stripe payment reference is available for an automatic refund.' }, { status: 400 })
    try {
      const stripe = getStripe()
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer',
        metadata: { whc_residency_booking_id: booking.id, whc_residency_dispute_resolution: 'true' },
      }, { idempotencyKey: `residency-dispute-${booking.id}-${Math.round(refundAmount * 100)}` })
      refundId = refund.id
    } catch (stripeError: any) {
      console.error('Residency refund failed:', stripeError?.message)
      return NextResponse.json({ error: 'Stripe could not issue the refund. Nothing was marked refunded.' }, { status: 502 })
    }
  }

  const { error: updateError } = await admin.from('residency_bookings').update({
    dispute_status: 'resolved',
    refund_amount: refundAmount || null,
    refunded_at: refundAmount > 0 ? new Date().toISOString() : null,
    payout_amount: payoutAmount,
    payout_status: payoutAmount > 0 ? 'pending' : 'cancelled',
  }).eq('id', booking.id)
  if (updateError) {
    console.error('Residency dispute DB update failed after Stripe action:', updateError.message, refundId)
    return NextResponse.json({ error: 'The Stripe refund may have been issued, but the booking record could not be updated. Check Stripe before retrying.' }, { status: 500 })
  }

  await notifyParties(
    admin,
    booking,
    'Residency issue resolved',
    payoutAmount > 0 ? `The Residency issue is resolved. Your payout is set at £${payoutAmount.toLocaleString('en-GB')}.` : 'The Residency issue is resolved. No specialist payout is due.',
    refundAmount > 0 ? `The Residency issue is resolved. A £${refundAmount.toLocaleString('en-GB')} refund has been issued.` : 'The Residency issue is resolved. No refund was issued.',
  )
  return NextResponse.json({ success: true, refundId })
}
