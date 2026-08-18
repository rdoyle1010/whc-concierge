import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { assertStripeModeMatchesOrigin, getSafeSiteOrigin } from '@/lib/site-origin'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const body = await req.json()
    const bookingId = String(body.bookingId || '')
    const origin = getSafeSiteOrigin(body.returnUrl)
    assertStripeModeMatchesOrigin(origin)

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,property_name,company_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 403 })

    const { data: booking } = await admin.from('residency_bookings').select('*').eq('id', bookingId).eq('employer_id', employer.id).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Residency booking not found.' }, { status: 404 })
    if (booking.status !== 'accepted') return NextResponse.json({ error: 'The residency must be accepted before payment.' }, { status: 400 })
    if (booking.paid_at) return NextResponse.json({ error: 'This residency has already been paid.' }, { status: 400 })

    const gross = Number(booking.agreed_total || booking.proposed_total || 0)
    const fee = Number((gross * 0.10).toFixed(2))
    if (gross <= 0) return NextResponse.json({ error: 'The agreed residency value is invalid.' }, { status: 400 })
    const totalPence = Math.round((gross + fee) * 100)

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Spa Platform - Residency Booking',
            description: `${booking.days_required} working days at £${Number(booking.agreed_day_rate || booking.proposed_day_rate).toFixed(0)}/day. Residency £${gross.toFixed(2)} + 10% platform fee £${fee.toFixed(2)}.`,
          },
          unit_amount: totalPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/employer/residency?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/employer/residency?payment=cancelled`,
      metadata: {
        type: 'residency_booking',
        booking_id: booking.id,
        employer_id: employer.id,
        user_id: user.id,
        gross: gross.toFixed(2),
        fee: fee.toFixed(2),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not start residency payment.' }, { status: 500 })
  }
}
