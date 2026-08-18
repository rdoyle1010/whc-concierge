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
    if (!bookingId || !['accept', 'decline'].includes(action)) return NextResponse.json({ error: 'Invalid response.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 403 })

    const { data: booking } = await admin.from('residency_bookings').select('*').eq('id', bookingId).eq('employer_id', employer.id).maybeSingle()
    if (!booking || booking.status !== 'countered') return NextResponse.json({ error: 'Counter-offer not found.' }, { status: 404 })

    const total = Number(booking.proposed_total)
    const patch = action === 'accept'
      ? { status: 'accepted', agreed_day_rate: booking.proposed_day_rate, agreed_total: total, platform_fee: Number((total * 0.10).toFixed(2)), updated_at: new Date().toISOString() }
      : { status: 'declined', updated_at: new Date().toISOString() }

    const { error } = await admin.from('residency_bookings').update(patch).eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id,full_name').eq('id', booking.candidate_id).maybeSingle()
    if (candidate?.user_id) {
      await createNotification(
        candidate.user_id,
        'general',
        action === 'accept' ? 'Residency counter-offer accepted' : 'Residency offer closed',
        action === 'accept' ? 'The property accepted your counter-offer. The booking is awaiting secure payment.' : 'The property declined the counter-offer.',
        '/talent/residency',
      )
    }

    return NextResponse.json({ success: true, status: patch.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not update residency offer.' }, { status: 500 })
  }
}
