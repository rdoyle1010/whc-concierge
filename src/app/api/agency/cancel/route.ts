import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

async function currentUser() {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return store.getAll() }, setAll() {} },
  })
  return (await client.auth.getUser()).data.user
}

function londonToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const bookingId = String(body.bookingId || '')
  const reason = String(body.reason || '').trim()
  if (!bookingId) return NextResponse.json({ error: 'Choose a booking to cancel.' }, { status: 400 })
  if (reason.length < 5) return NextResponse.json({ error: 'Please give a short reason for the cancellation - a few words is enough.' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }, { data: booking }] = await Promise.all([
    admin.from('candidate_profiles').select('id,user_id,full_name').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle(),
    admin.from('agency_bookings').select('*').eq('id', bookingId).maybeSingle(),
  ])
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  const role = booking.candidate_id === candidate?.id ? 'candidate' : booking.employer_id === employer?.id ? 'employer' : null
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!['accepted','confirmed'].includes(booking.status)) return NextResponse.json({ error: `This shift is currently '${booking.status}', so there is nothing to cancel - it may have just been actioned from the other side. Refresh the page to see its latest state.` }, { status: 400 })
  if (booking.shift_date < londonToday()) return NextResponse.json({ error: 'This shift has already passed. Use Shift Resolution instead.' }, { status: 400 })

  const fee = Math.max(0, Number(booking.platform_fee || 0))
  const gross = Math.max(0, Number(booking.rate || 0) * Number(booking.hours || 8))
  const paid = Boolean(booking.paid_at)

  // Late-cancellation policy: a property cancelling within 24 hours of the
  // shift is asking a professional to absorb a day they held for the booking.
  // Policy default: 50% refund to the property, 50% compensates the
  // professional. Admin reviews every case and can override either way.
  const tomorrow = (() => { const d = new Date(`${londonToday()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) })()
  const lateEmployerCancellation = role === 'employer' && String(booking.shift_date) <= tomorrow

  // Before payment there is no money to retain. After payment Talent House's agreed
  // admin/platform fee remains earned; the shift money is frozen for Admin to
  // decide any refund/compensation under the cancellation policy.
  const update: Record<string, any> = {
    status: 'cancelled',
    cancellation_requested_by: role,
    cancellation_requested_at: new Date().toISOString(),
    cancellation_reason: reason,
    admin_fee_retained: paid ? fee : 0,
  }
  if (paid) {
    update.dispute_status = 'open'
    update.payout_status = 'on_hold'
    update.dispute_reason = `${role === 'candidate' ? 'Professional' : 'Property'} cancelled before the shift: ${reason}`
  }
  const { error: updateError } = await admin.from('agency_bookings').update(update).eq('id', booking.id)
  if (updateError) return NextResponse.json({ error: 'Could not cancel this shift.' }, { status: 500 })

  if (paid) {
    const { data: existing } = await admin.from('agency_cases').select('id').eq('booking_id', booking.id)
      .in('status', ['open','awaiting_response','under_review','awaiting_payment']).maybeSingle()
    if (!existing) {
      await admin.from('agency_cases').insert({
        booking_id: booking.id,
        opened_by_user_id: user.id,
        opened_by_role: role,
        issue_type: role === 'candidate' ? 'professional_cancelled' : 'property_cancelled',
        description: reason,
        requested_adjustment_type: role === 'employer' ? 'refund' : 'none',
        requested_amount: role === 'employer' ? (lateEmployerCancellation ? Math.round(gross / 2) : gross) : null,
        requested_reason: lateEmployerCancellation
          ? `Late cancellation by the property within 24 hours of the shift. Policy default: 50% refund (£${Math.round(gross / 2)}), 50% (£${gross - Math.round(gross / 2)}) compensates the professional for the held day. Talent House admin fee of £${fee} is retained.`
          : `Pre-shift cancellation. Talent House admin fee of £${fee} is retained.`,
        status: 'under_review',
      })
    }
  }

  const [{ data: cand }, { data: emp }] = await Promise.all([
    admin.from('candidate_profiles').select('user_id,full_name').eq('id', booking.candidate_id).maybeSingle(),
    admin.from('employer_profiles').select('user_id,property_name,company_name').eq('id', booking.employer_id).maybeSingle(),
  ])
  const otherUser = role === 'candidate' ? emp?.user_id : cand?.user_id
  if (otherUser) {
    await createNotification(otherUser, 'general', 'Agency shift cancelled',
      `${role === 'candidate' ? cand?.full_name || 'The professional' : emp?.property_name || emp?.company_name || 'The property'} cancelled the ${booking.shift_date} Agency shift. ${paid ? `Talent House will review the money; the £${fee} admin fee is retained.` : 'No payment had been collected.'}`,
      role === 'candidate' ? '/employer/agency' : '/talent/agency')
  }

  return NextResponse.json({ success: true, paid, admin_fee_retained: paid ? fee : 0, gross_shift_value: gross })
}
