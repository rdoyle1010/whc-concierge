import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import { feePctForEmployerShift } from '@/app/api/agency/booking/core'
import { sendSms } from '@/lib/sms'
import { sendAgencyOfferEmail, sendAgencyUpdateEmail } from '@/lib/emails'
import { emailAllowed, smsAllowed } from '@/lib/notification-prefs'

const OPEN_STATUSES = ['pending', 'countered']
const CASCADE_WINDOW_MS = 30 * 60 * 1000
const CASCADE_TOTAL_MS = 4 * 60 * 60 * 1000

function employerDisplayName(emp: any) {
  return emp?.property_name || emp?.company_name || 'A property'
}

function isExpired(booking: any) {
  return Boolean(booking?.expires_at && new Date(booking.expires_at).getTime() < Date.now())
}

async function notifyOtherParty(admin: ReturnType<typeof createAdminClient>, recipientUserId: string | null | undefined, senderUserId: string, title: string, body: string, link: string) {
  if (!recipientUserId) return
  await Promise.allSettled([
    createNotification(recipientUserId, 'general', title, body, link),
    admin.from('messages').insert({ sender_id: senderUserId, recipient_id: recipientUserId, content: body, read: false }).then(() => null),
    // Preference-gated ('booking_updates'): booking update emails honour the
    // recipient's opt-out; bell + inbox always fire. Fail-open.
    emailAllowed(admin, recipientUserId, 'booking_updates').then(allowed => allowed
      ? admin.auth.admin.getUserById(recipientUserId).then(({ data }: any) => {
          const email = data?.user?.email
          return email ? sendAgencyUpdateEmail(email, 'there', title, body, link) : null
        })
      : null),
  ])
}

async function alertCascadeHolder(admin: ReturnType<typeof createAdminClient>, candidate: { user_id?: string | null; full_name?: string | null; phone?: string | null; sms_opt_in?: boolean | null }, empName: string, empUserId: string, booking: { shift_date: string; rate: number; hours: number | null; expires_at: string }) {
  const mins = Math.max(1, Math.round((new Date(booking.expires_at).getTime() - Date.now()) / 60000))
  const body = `URGENT: ${empName} needs cover TODAY and has offered you a shift at £${booking.rate} per hour${booking.hours ? ` (${booking.hours} hours - £${booking.rate * booking.hours} total)` : ''}. You have ${mins} minutes before the offer moves to the next therapist.`
  if (candidate.user_id) {
    const userId = candidate.user_id
    await Promise.allSettled([
      createNotification(userId, 'general', 'URGENT: shift offer for today', body, '/talent/agency'),
      admin.from('messages').insert({ sender_id: empUserId, recipient_id: userId, content: body, read: false }).then(() => null),
      // Preference-gated ('booking_updates'): offer email honours the opt-out;
      // bell + inbox always fire. Fail-open.
      emailAllowed(admin, userId, 'booking_updates').then(allowed => allowed
        ? admin.auth.admin.getUserById(userId).then(({ data }: any) => {
            const email = data?.user?.email
            return email ? sendAgencyOfferEmail(email, candidate.full_name || 'there', { propertyName: empName, shiftDate: booking.shift_date, rate: booking.rate, hours: booking.hours, urgent: true, expiresAt: booking.expires_at }) : null
          })
        : null),
    ])
  }
  // SMS is consent-gated: sms_opt_in plus a phone number on file.
  if (smsAllowed(candidate)) await sendSms(candidate.phone, `WHC Concierge: ${empName} needs cover TODAY - £${booking.rate}/hr. You have ${mins} mins to respond in Agency.`).catch(() => null)
}

async function advanceCascade(admin: ReturnType<typeof createAdminClient>, booking: any) {
  const queue: any[] = Array.isArray(booking.cascade_queue) ? booking.cascade_queue : []
  const index = booking.cascade_index ?? 0
  const startedAt = booking.created_at ? new Date(booking.created_at).getTime() : Date.now()
  const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('id', booking.employer_id).maybeSingle()
  const empName = employerDisplayName(employer)

  async function endCascade(reason: string) {
    const { data: ended } = await admin.from('agency_bookings').update({ status: 'expired' }).eq('id', booking.id).eq('cascade_index', index).in('status', OPEN_STATUSES).select('id').maybeSingle()
    if (ended && employer?.user_id) {
      const message = `We couldn't fill your urgent shift on ${booking.shift_date} - ${reason}. You can send a new request, widen the rate, or book someone directly.`
      await notifyOtherParty(admin, employer.user_id, employer.user_id, 'Urgent cover not filled', message, '/employer/agency')
    }
    return null
  }

  if (Date.now() - startedAt > CASCADE_TOTAL_MS) return endCascade('the 4-hour window ran out')
  const next = index + 1
  if (next >= queue.length) return endCascade(`all ${queue.length} matching therapists were offered it`)

  const entry = queue[next]
  const hours = booking.hours && booking.hours > 0 ? booking.hours : null
  const effectiveHours = hours || 8
  const rate = parseInt(String(entry.rate), 10) || booking.rate
  const deadline = new Date(Date.now() + CASCADE_WINDOW_MS).toISOString()
  const { data: updated, error: advanceError } = await admin.from('agency_bookings').update({ candidate_id: entry.id, rate, platform_fee: Math.ceil(rate * effectiveHours * await feePctForEmployerShift(admin, booking.employer_id, booking.shift_date)), status: 'pending', cascade_index: next, cascade_deadline: deadline, expires_at: deadline }).eq('id', booking.id).eq('cascade_index', index).in('status', OPEN_STATUSES).select('*').maybeSingle()
  if (advanceError) {
    // A rejected update must not strand the cascade mid-queue: log it and end
    // the cascade so the property is told cover was not filled.
    console.error('Cascade advance failed:', advanceError.message)
    return endCascade('the next offer could not be issued')
  }
  if (!updated) return null

  const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name,phone,sms_opt_in').eq('id', entry.id).maybeSingle()
  if (candidate && employer?.user_id) {
    await alertCascadeHolder(admin, candidate, empName, employer.user_id, { shift_date: booking.shift_date, rate, hours, expires_at: deadline })
  }
  return updated
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const action = String(body.action || '')
    const bookingId = String(body.bookingId || '')
    if (!bookingId || !['accept', 'decline', 'counter', 'accept_group'].includes(action)) return NextResponse.json({ error: 'Invalid booking action.' }, { status: 400 })

    const admin = createAdminClient()
    const [{ data: candidate }, { data: employer }] = await Promise.all([
      admin.from('candidate_profiles').select('id,full_name,user_id').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('id,company_name,property_name,user_id').eq('user_id', user.id).maybeSingle(),
    ])
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    const isCandidateParty = Boolean(candidate && booking.candidate_id === candidate.id)
    const isEmployerParty = Boolean(employer && booking.employer_id === employer.id)
    if (!isCandidateParty && !isEmployerParty) return NextResponse.json({ error: 'You are not part of this booking.' }, { status: 403 })

    const [{ data: bookingEmployer }, { data: bookingCandidate }] = await Promise.all([
      admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('id', booking.employer_id).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name').eq('id', booking.candidate_id).maybeSingle(),
    ])
    const otherUserId = isCandidateParty ? bookingEmployer?.user_id : bookingCandidate?.user_id
    const actorName = isCandidateParty ? (bookingCandidate?.full_name || 'The candidate') : employerDisplayName(bookingEmployer)
    const otherLink = isCandidateParty ? '/employer/agency' : '/talent/agency'
    const shiftDate = booking.shift_date || 'the agreed date'

    if (action === 'accept_group') {
      if (!isCandidateParty) return NextResponse.json({ error: 'Only the professional can accept a standing booking.' }, { status: 403 })
      if (!booking.booking_group) return NextResponse.json({ error: 'This offer is not part of a standing booking.' }, { status: 400 })
      const { data: accepted, error } = await admin.from('agency_bookings').update({ status: 'accepted' }).eq('booking_group', booking.booking_group).eq('candidate_id', booking.candidate_id).in('status', OPEN_STATUSES).select('*')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!accepted?.length) return NextResponse.json({ error: 'These offers are no longer open.' }, { status: 409 })
      await notifyOtherParty(admin, otherUserId, user.id, 'Standing booking accepted', `${actorName} has accepted all ${accepted.length} shifts in the standing booking from ${booking.shift_date} at £${booking.rate} per hour.`, otherLink)
      return NextResponse.json({ success: true, accepted: accepted.length })
    }

    if (!OPEN_STATUSES.includes(booking.status)) return NextResponse.json({ error: `This offer has already been ${booking.status}.` }, { status: 409 })

    if (isExpired(booking)) {
      if (Array.isArray(booking.cascade_queue)) {
        await advanceCascade(admin, booking)
        return NextResponse.json({ error: 'This urgent offer expired and has moved to the next professional.' }, { status: 409 })
      }
      await admin.from('agency_bookings').update({ status: 'expired' }).eq('id', booking.id).in('status', OPEN_STATUSES)
      return NextResponse.json({ error: 'This offer has expired. Ask the property to send a new one if the shift is still available.' }, { status: 409 })
    }

    if (action === 'counter') {
      if (!isCandidateParty) return NextResponse.json({ error: 'Only the professional can counter an offer.' }, { status: 403 })
      const rate = parseInt(String(body.rate || ''), 10)
      if (!rate || rate <= 0) return NextResponse.json({ error: 'Enter a valid hourly rate.' }, { status: 400 })
      const effectiveHours = booking.hours && booking.hours > 0 ? booking.hours : 8
      const update: Record<string, any> = { rate, platform_fee: Math.ceil(rate * effectiveHours * await feePctForEmployerShift(admin, booking.employer_id, booking.shift_date)), status: 'countered' }
      if (Array.isArray(booking.cascade_queue)) {
        const fresh = new Date(Date.now() + CASCADE_WINDOW_MS).toISOString()
        update.cascade_deadline = fresh
        update.expires_at = fresh
      }
      const { data: updated, error } = await admin.from('agency_bookings').update(update).eq('id', booking.id).in('status', OPEN_STATUSES).select('*').maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!updated) return NextResponse.json({ error: 'This offer is no longer open.' }, { status: 409 })
      await notifyOtherParty(admin, otherUserId, user.id, 'Counter-offer received', `${actorName} has countered the agency offer for ${shiftDate} at £${rate} per hour.`, otherLink)
      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'accept') {
      const { data: updated, error } = await admin.from('agency_bookings').update({ status: 'accepted' }).eq('id', booking.id).in('status', OPEN_STATUSES).select('*').maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!updated) return NextResponse.json({ error: 'This offer is no longer open.' }, { status: 409 })
      const effectiveHours = booking.hours && booking.hours > 0 ? booking.hours : 8
      const totalDue = booking.rate * effectiveHours + (updated.platform_fee || Math.ceil(booking.rate * effectiveHours * AGENCY_PLATFORM_FEE_PCT))
      const message = isCandidateParty ? `${actorName} has accepted the agency offer for ${shiftDate} at £${booking.rate} per hour. To confirm the booking, pay £${totalDue} from Agency Bookings.` : `${actorName} has accepted the counter-offer for ${shiftDate} at £${booking.rate} per hour. The booking is confirmed once payment is made.`
      await notifyOtherParty(admin, otherUserId, user.id, 'Agency offer accepted', message, otherLink)
      return NextResponse.json({ success: true, booking: updated, paymentRequired: isCandidateParty, totalDue })
    }

    if (isCandidateParty && Array.isArray(booking.cascade_queue)) {
      const moved = await advanceCascade(admin, booking)
      return NextResponse.json({ success: true, cascaded: Boolean(moved), message: moved ? 'The offer has moved to the next professional.' : 'The property has been told the shift could not be filled.' })
    }

    const { data: updated, error } = await admin.from('agency_bookings').update({ status: 'declined' }).eq('id', booking.id).in('status', OPEN_STATUSES).select('*').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!updated) return NextResponse.json({ error: 'This offer is no longer open.' }, { status: 409 })
    await notifyOtherParty(admin, otherUserId, user.id, 'Agency offer declined', `${actorName} has declined the agency offer for ${shiftDate}.`, otherLink)
    return NextResponse.json({ success: true, booking: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update this booking.' }, { status: 500 })
  }
}
