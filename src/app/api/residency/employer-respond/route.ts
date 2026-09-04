import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

    const body = await req.json()
    const bookingId = String(body.bookingId || '')
    const action = String(body.action || '')
    if (!bookingId || !['accept', 'decline', 'counter'].includes(action)) return NextResponse.json({ error: 'Invalid response.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 403 })

    const { data: booking } = await admin.from('residency_bookings').select('*').eq('id', bookingId).eq('employer_id', employer.id).maybeSingle()
    if (!booking || booking.status !== 'countered') return NextResponse.json({ error: 'Counter-offer not found.' }, { status: 404 })
    if (action === 'accept' && booking.countered_by === 'employer') {
      return NextResponse.json({ error: 'You have countered - the specialist needs to respond before anything can be agreed.' }, { status: 409 })
    }

    const total = Number(booking.proposed_total)
    let patch: Record<string, any>
    if (action === 'accept') {
      patch = { status: 'accepted', agreed_day_rate: booking.proposed_day_rate, agreed_total: total, platform_fee: Number((total * 0.10).toFixed(2)), updated_at: new Date().toISOString() }
    } else if (action === 'counter') {
      const counterDayRate = Number(body.counterDayRate || 0)
      if (counterDayRate <= 0) return NextResponse.json({ error: 'Enter a valid counter day rate.' }, { status: 400 })
      const counterTotal = Number((counterDayRate * Number(booking.days_required)).toFixed(2))
      patch = { status: 'countered', countered_by: 'employer', proposed_day_rate: counterDayRate, proposed_total: counterTotal, platform_fee: Number((counterTotal * 0.10).toFixed(2)), updated_at: new Date().toISOString() }
    } else {
      patch = { status: 'declined', updated_at: new Date().toISOString() }
    }

    const { error } = await admin.from('residency_bookings').update(patch).eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id,full_name').eq('id', booking.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      await createNotification(
        candidate.user_id,
        'general',
        action === 'accept' ? 'Residency counter-offer accepted' : action === 'counter' ? 'New counter-offer from the property' : 'Residency offer closed',
        action === 'accept' ? 'The property accepted your counter-offer. The booking is awaiting secure payment.' : action === 'counter' ? `The property has countered at £${patch.proposed_day_rate}/day. Review and respond from your Residency page.` : 'The property declined the counter-offer.',
        '/talent/residency',
      )
    }

    return NextResponse.json({ success: true, status: patch.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not update residency offer.' }, { status: 500 })
  }
}
