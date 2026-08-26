import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { bookingId } = await req.json()
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

    const effectiveHours = booking.hours && booking.hours > 0 ? booking.hours : 8
    const gross = (booking.rate || 0) * effectiveHours
    const fee = booking.platform_fee && booking.platform_fee > 0
      ? booking.platform_fee
      : Math.ceil(gross * AGENCY_PLATFORM_FEE_PCT)
    const totalPounds = gross + fee
    if (!gross || totalPounds <= 0) return NextResponse.json({ error: 'Could not work out the total for this booking.' }, { status: 400 })

    const stripe = getStripe()
    const site = 'https://talent.wellnesshousecollective.co.uk'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'WHC Concierge - Agency Shift Booking',
            description: `${booking.shift_date || 'Agreed date'}: £${booking.rate}/hr × ${effectiveHours}h (£${gross}) + WHC fee (£${fee}). The professional receives the full £${gross} agreed shift amount after the completed shift.`,
          },
          unit_amount: totalPounds * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      allow_promotion_codes: false,
      success_url: `${site}/agency?paid=processing&booking=${encodeURIComponent(booking.id)}`,
      cancel_url: `${site}/agency?paid=cancelled&booking=${encodeURIComponent(booking.id)}`,
      metadata: {
        type: 'agency_booking',
        booking_id: booking.id,
        employer_id: employer.id,
        user_id: user.id,
        gross: String(gross),
        fee: String(fee),
      },
    })

    return NextResponse.json({ url: session.url, gross, fee, total: totalPounds })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not start payment.' }, { status: 500 })
  }
}
