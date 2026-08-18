import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getStripe } from '@/lib/stripe'

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

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing checkout session.' }, { status: 400 })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(String(sessionId))
    if (session.payment_status !== 'paid' || session.metadata?.type !== 'residency_booking') {
      return NextResponse.json({ error: 'Residency payment has not completed.' }, { status: 400 })
    }
    if (session.metadata.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const bookingId = session.metadata.booking_id
    const gross = Number(session.metadata.gross || 0)
    const fee = Number(session.metadata.fee || 0)
    if (!bookingId || gross <= 0) return NextResponse.json({ error: 'Invalid residency payment metadata.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: booking } = await admin.from('residency_bookings').select('*').eq('id', bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Residency booking not found.' }, { status: 404 })

    if (!booking.paid_at) {
      const { error } = await admin.from('residency_bookings').update({
        status: 'confirmed',
        agreed_total: gross,
        platform_fee: fee,
        amount_paid: gross + fee,
        payout_amount: gross,
        payout_status: 'pending',
        paid_at: new Date().toISOString(),
        stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        updated_at: new Date().toISOString(),
      }).eq('id', bookingId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const [{ data: candidate }, { data: employer }] = await Promise.all([
        admin.from('candidate_profiles').select('user_id,full_name').eq('id', booking.candidate_id).maybeSingle(),
        admin.from('employer_profiles').select('user_id,property_name,company_name').eq('id', booking.employer_id).maybeSingle(),
      ])
      const propertyName = employer?.property_name || employer?.company_name || booking.property_name
      if (candidate?.user_id) {
        await createNotification(candidate.user_id, 'general', 'Residency confirmed - payment received', `${propertyName} has confirmed and paid for your residency. Your agreed terms are now locked in on Spa Platform.`, '/talent/residency')
      }
      if (employer?.user_id) {
        await createNotification(employer.user_id, 'general', 'Residency booking confirmed', `${candidate?.full_name || 'The specialist'} is confirmed for ${booking.start_date} to ${booking.end_date}.`, '/employer/residency')
      }
    }

    return NextResponse.json({ success: true, bookingId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not confirm residency payment.' }, { status: 500 })
  }
}
