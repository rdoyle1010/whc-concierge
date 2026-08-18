import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

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
    const action = String(body.action || '')
    if (!bookingId || !['accept', 'counter', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid residency response.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,user_id,full_name').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 403 })

    const { data: booking } = await admin.from('residency_bookings').select('*')
      .eq('id', bookingId).eq('candidate_id', candidate.id).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Residency offer not found.' }, { status: 404 })
    if (!['offered', 'countered'].includes(booking.status)) {
      return NextResponse.json({ error: `This offer is already ${booking.status}.` }, { status: 400 })
    }

    let patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (action === 'accept') {
      const dayRate = Number(booking.proposed_day_rate)
      const total = Number(booking.proposed_total)
      patch = { ...patch, status: 'accepted', agreed_day_rate: dayRate, agreed_total: total, platform_fee: Number((total * 0.10).toFixed(2)) }
    } else if (action === 'decline') {
      patch = { ...patch, status: 'declined' }
    } else {
      const counterDayRate = Number(body.counterDayRate || 0)
      if (counterDayRate <= 0) return NextResponse.json({ error: 'Enter a valid counter day rate.' }, { status: 400 })
      const total = Number((counterDayRate * Number(booking.days_required)).toFixed(2))
      patch = {
        ...patch,
        status: 'countered',
        proposed_day_rate: counterDayRate,
        proposed_total: total,
        platform_fee: Number((total * 0.10).toFixed(2)),
      }
    }

    const { error } = await admin.from('residency_bookings').update(patch).eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: employer } = await admin.from('employer_profiles')
      .select('user_id,property_name,company_name').eq('id', booking.employer_id).maybeSingle()
    if (employer?.user_id) {
      const talentName = candidate.full_name || 'The specialist'
      const title = action === 'accept' ? 'Residency offer accepted' : action === 'counter' ? 'New residency counter-offer' : 'Residency offer declined'
      const message = action === 'accept'
        ? `${talentName} accepted your residency offer. Confirm and pay securely through Spa Platform to lock in the booking.`
        : action === 'counter'
          ? `${talentName} proposed £${Number(patch.proposed_day_rate).toFixed(0)}/day. Review the updated offer in Residency.`
          : `${talentName} declined the residency offer.`
      await createNotification(employer.user_id, 'general', title, message, '/employer/residency')
    }

    return NextResponse.json({ success: true, status: patch.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not update residency offer.' }, { status: 500 })
  }
}
