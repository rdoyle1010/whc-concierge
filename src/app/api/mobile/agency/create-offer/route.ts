import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import { sendSms } from '@/lib/sms'
import { sendAgencyOfferEmail } from '@/lib/emails'
import { profileDistanceMiles } from '@/lib/geo'
import { shiftHours, validShiftWindow, windowCovers, windowsOverlap } from '@/lib/agency-time'

const URGENT_EXPIRY_MS = 4 * 60 * 60 * 1000
const STANDARD_EXPIRY_MS = 48 * 60 * 60 * 1000

function todayInLondon() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

function employerDisplayName(emp: any) {
  return emp?.property_name || emp?.company_name || 'A property'
}

async function candidateCanWork(admin: ReturnType<typeof createAdminClient>, candidateId: string, date: string, start: string, end: string) {
  const { data: windows, error } = await admin.from('agency_availability_windows')
    .select('start_time,end_time').eq('candidate_id', candidateId).eq('date', date)
  if (error) return { ok: false, error: 'Availability could not be checked.' }
  const covered = (windows || []).some((window: any) => windowCovers(
    String(window.start_time).slice(0, 5), String(window.end_time).slice(0, 5), start, end,
  ))
  if (!covered) return { ok: false, error: 'This professional is no longer available for the full shift.' }

  const { data: bookings, error: bookingError } = await admin.from('agency_bookings')
    .select('shift_start_time,shift_end_time').eq('candidate_id', candidateId).eq('shift_date', date)
    .in('status', ['pending', 'countered', 'accepted', 'confirmed'])
  if (bookingError) return { ok: false, error: 'Existing bookings could not be checked.' }
  const busy = (bookings || []).some((booking: any) => !booking.shift_start_time || !booking.shift_end_time || windowsOverlap(
    String(booking.shift_start_time).slice(0, 5), String(booking.shift_end_time).slice(0, 5), start, end,
  ))
  return busy ? { ok: false, error: 'This professional has just become unavailable for that time.' } : { ok: true }
}

async function insertBooking(admin: ReturnType<typeof createAdminClient>, row: Record<string, any>) {
  const { data, error } = await admin.from('agency_bookings').insert(row).select('*').single()
  return { data, error }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const candidateId = String(body.candidateId || '')
    const shiftDate = String(body.shiftDate || '')
    const shiftStartTime = String(body.shiftStartTime || '')
    const shiftEndTime = String(body.shiftEndTime || '')
    const shiftType = String(body.shiftType || '').trim().slice(0, 120) || null
    const rate = parseInt(String(body.rate || ''), 10)
    const repeatWeeks = Math.min(8, Math.max(1, parseInt(String(body.repeatWeeks || '1'), 10) || 1))

    if (!candidateId || !rate || rate <= 0) return NextResponse.json({ error: 'Choose a professional and enter a valid hourly rate.' }, { status: 400 })
    if (!validShiftWindow(shiftDate, shiftStartTime, shiftEndTime)) return NextResponse.json({ error: 'Choose a valid shift date, start time and finish time.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
    if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved before booking Agency Talent.' }, { status: 403 })
    if (!employer.preferred_employer) return NextResponse.json({ error: 'Agency bookings are for registered Preferred Employers. Register from Agency Bookings before sending offers.' }, { status: 403 })
    if (employer.preferred_until && new Date(employer.preferred_until).getTime() < Date.now()) return NextResponse.json({ error: 'Your Preferred Employer registration has expired.' }, { status: 403 })

    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,user_id,full_name,phone,approval_status,profile_visible,agency_available,agency_listed_until,latitude,longitude,travel_radius_miles')
      .eq('id', candidateId).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Professional not found.' }, { status: 404 })
    if (candidate.approval_status !== 'approved' || candidate.profile_visible === false || !candidate.agency_available) {
      return NextResponse.json({ error: 'This professional is not currently bookable on the Agency register.' }, { status: 403 })
    }
    if (candidate.agency_listed_until && new Date(candidate.agency_listed_until).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This professional’s Agency registration has expired.' }, { status: 403 })
    }

    const { data: block } = await admin.from('profile_blocks').select('id').eq('candidate_id', candidate.id).eq('blocked_employer_id', employer.id).maybeSingle()
    if (block) return NextResponse.json({ error: 'This profile is not available to your property.' }, { status: 403 })

    const distance = profileDistanceMiles(candidate, employer)
    if (candidate.travel_radius_miles && (distance == null || distance > candidate.travel_radius_miles)) {
      return NextResponse.json({ error: 'This shift is outside the professional’s travel radius.' }, { status: 400 })
    }

    const workCheck = await candidateCanWork(admin, candidate.id, shiftDate, shiftStartTime, shiftEndTime)
    if (!workCheck.ok) return NextResponse.json({ error: workCheck.error }, { status: 409 })

    const repeatDates: string[] = []
    for (let week = 1; week < repeatWeeks; week++) {
      const date = new Date(`${shiftDate}T12:00:00Z`)
      date.setUTCDate(date.getUTCDate() + 7 * week)
      const repeatDate = date.toISOString().slice(0, 10)
      const repeatCheck = await candidateCanWork(admin, candidate.id, repeatDate, shiftStartTime, shiftEndTime)
      if (!repeatCheck.ok) return NextResponse.json({ error: `Week ${week + 1}: ${repeatCheck.error}` }, { status: 409 })
      repeatDates.push(repeatDate)
    }

    const hours = shiftHours(shiftStartTime, shiftEndTime) || 0
    const effectiveHours = hours || 8
    const platformFee = Math.ceil(rate * effectiveHours * AGENCY_PLATFORM_FEE_PCT)
    const urgent = shiftDate === todayInLondon()
    const groupId = repeatWeeks > 1 && globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : null
    const baseRow: Record<string, any> = {
      candidate_id: candidate.id,
      employer_id: employer.id,
      shift_date: shiftDate,
      shift_start_time: shiftStartTime,
      shift_end_time: shiftEndTime,
      shift_type: shiftType,
      hours: hours > 0 ? hours : null,
      rate,
      platform_fee: platformFee,
      status: 'pending',
      urgent,
      expires_at: new Date(Date.now() + (urgent ? URGENT_EXPIRY_MS : STANDARD_EXPIRY_MS)).toISOString(),
      ...(groupId ? { booking_group: groupId } : {}),
    }

    const { data: booking, error } = await insertBooking(admin, baseRow)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let created = 1
    for (const repeatDate of repeatDates) {
      const { error: repeatError } = await insertBooking(admin, {
        ...baseRow,
        shift_date: repeatDate,
        urgent: false,
        expires_at: new Date(Date.now() + STANDARD_EXPIRY_MS).toISOString(),
      })
      if (!repeatError) created++
    }

    const propertyName = employerDisplayName(employer)
    const standingLine = created > 1 ? ` This is a standing booking covering ${created} weekly shifts.` : ''
    const offerBody = urgent
      ? `URGENT: ${propertyName} needs cover today and has offered you £${rate} per hour${hours ? ` for ${hours} hours` : ''}. Respond from Agency in the app.${standingLine}`
      : `${propertyName} has offered you an Agency shift on ${shiftDate} at £${rate} per hour${hours ? ` for ${hours} hours` : ''}. Respond from Agency in the app.${standingLine}`

    if (candidate.user_id) {
      await Promise.allSettled([
        createNotification(candidate.user_id, 'general', urgent ? 'URGENT: shift offer for today' : 'New Agency offer', offerBody, '/talent/agency'),
        admin.from('messages').insert({ sender_id: user.id, recipient_id: candidate.user_id, content: offerBody, read: false }).then(() => null),
        admin.auth.admin.getUserById(candidate.user_id).then(({ data }: any) => {
          const email = data?.user?.email
          return email ? sendAgencyOfferEmail(email, candidate.full_name || 'there', {
            propertyName,
            shiftDate,
            rate,
            hours: hours || null,
            urgent,
            expiresAt: baseRow.expires_at,
          }) : null
        }),
      ])
    }
    if (urgent) await sendSms(candidate.phone, `WHC Concierge: ${propertyName} needs cover TODAY - £${rate}/hr. Open Agency in the app to respond.`).catch(() => null)

    return NextResponse.json({ success: true, booking, created, urgent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not send this Agency offer.' }, { status: 500 })
  }
}
