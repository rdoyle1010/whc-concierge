import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { agencyShiftMoney, bpsToPercentLabel, formatPence } from '@/lib/agency-money'

const RETURN_PATHS = new Set(['/agency', '/employer/agency'])

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const bookingId = body.bookingId
    const returnPath = RETURN_PATHS.has(String(body.returnPath || '')) ? String(body.returnPath) : '/agency'
    if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

    const admin = createAdminClient()
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: employer } = await admin.from('employer_profiles').select('id,user_id').eq('id', booking.employer_id).maybeSingle()
    if (!employer || employer.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (booking.status !== 'accepted') {
      return NextResponse.json({ error: `Payment is due once a shift is accepted (this one is ${booking.status}).` }, { status: 400 })
    }
    if (booking.paid_at || booking.fee_paid_at) return NextResponse.json({ error: 'This booking has already been paid.' }, { status: 400 })

    // Integer pence throughout. A shift that is not a whole number of
    // quarter-hours used to produce a fractional unit_amount that Stripe
    // refused, so the property simply could not pay.
    const money = agencyShiftMoney({
      ratePounds: booking.rate,
      hours: booking.hours,
      storedFeePounds: booking.platform_fee,
    })
    if (money.grossPence <= 0 || money.totalPence <= 0) {
      return NextResponse.json({ error: 'Could not work out the total for this booking.' }, { status: 400 })
    }

    const stripe = getStripe()
    const site = 'https://talent.wellnesshousecollective.co.uk'

    // One shift, one live checkout. Without this a property that goes back
    // and clicks Pay again ends up with two valid sessions, and paying both
    // charges them twice for the same shift with nothing recording it.
    if (booking.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(String(booking.stripe_checkout_session_id))
        if (existing?.status === 'open' && existing.url) {
          return NextResponse.json({ url: existing.url, reused: true })
        }
      } catch { }
    }

    const feePctLabel = bpsToPercentLabel(Math.round((money.feePence / Math.max(1, money.grossPence)) * 10000))
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'WHC Concierge - Agency Shift Booking',
            description: `${booking.shift_date || 'Agreed date'}: £${booking.rate}/hr × ${money.hours}h (${formatPence(money.grossPence)}) + ${feePctLabel}% WHC fee (${formatPence(money.feePence)}). The professional receives the full ${formatPence(money.grossPence)} agreed shift amount after the completed shift.`,
          },
          unit_amount: money.totalPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      allow_promotion_codes: false,
      success_url: `${site}${returnPath}?paid=processing&booking=${encodeURIComponent(booking.id)}`,
      cancel_url: `${site}${returnPath}?paid=cancelled&booking=${encodeURIComponent(booking.id)}`,
      metadata: {
        type: 'agency_booking',
        booking_id: booking.id,
        employer_id: employer.id,
        user_id: user.id,
        // Pence are authoritative. The pound fields stay for older sessions
        // still in flight when this deploys.
        gross_pence: String(money.grossPence),
        fee_pence: String(money.feePence),
        gross: String(money.grossPounds),
        fee: String(money.feePounds),
        fee_bps: String(money.feeBps),
      },
    })

    // Recording the session lets a second payment attempt be recognised
    // rather than silently creating a second live checkout for one shift.
    try {
      await admin.from('agency_bookings').update({ stripe_checkout_session_id: session.id }).eq('id', booking.id)
    } catch { }

    return NextResponse.json({
      url: session.url,
      gross: money.grossPounds,
      fee: money.feePounds,
      total: money.totalPounds,
      feePct: Number(feePctLabel),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not start payment.' }, { status: 500 })
  }
}
