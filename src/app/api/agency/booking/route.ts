import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import { sendSms } from '@/lib/sms'
import { sendAgencyOfferEmail } from '@/lib/emails'
import { profileDistanceMiles } from '@/lib/geo'

// Offers expire so urgent cover doesn't sit unanswered while the property
// waits: 4 hours for same-day (urgent) shifts, 48 hours otherwise.
const URGENT_EXPIRY_MS = 4 * 60 * 60 * 1000
const STANDARD_EXPIRY_MS = 48 * 60 * 60 * 1000

function todayInLondon(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

function isExpired(booking: any): boolean {
  return Boolean(booking.expires_at && new Date(booking.expires_at).getTime() < Date.now())
}

// Agency offer / counter-offer flow.
// All writes use the service-role client because client-side RLS on
// agency_bookings is unreliable. The caller is authenticated via cookies.

const OPEN_STATUSES = ['pending', 'countered']

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

// The live table may have drifted from migration 004. If an insert fails
// because a column does not exist, strip that key and retry (max 6 strips).
async function insertBookingDefensively(admin: any, row: Record<string, any>) {
  const attempt: Record<string, any> = { ...row }
  let lastError: any = null
  for (let strips = 0; strips <= 6; strips++) {
    const { data, error } = await admin.from('agency_bookings').insert(attempt).select('*').single()
    if (!error) return { data, error: null }
    lastError = error
    const m = /Could not find the '([^']+)' column/.exec(error.message || '')
    if (m && Object.prototype.hasOwnProperty.call(attempt, m[1])) {
      delete attempt[m[1]]
      continue
    }
    break
  }
  return { data: null, error: lastError }
}

function employerDisplayName(emp: any) {
  return emp?.property_name || emp?.company_name || 'A property'
}

// Notify the other party in-app and drop the same note into their inbox.
async function notifyOtherParty(
  admin: any,
  recipientUserId: string | null | undefined,
  senderUserId: string,
  title: string,
  body: string,
  link: string,
) {
  if (!recipientUserId) return
  try {
    await createNotification(recipientUserId, 'general', title, body, link)
  } catch { /* non-fatal */ }
  try {
    await admin.from('messages').insert({
      sender_id: senderUserId,
      recipient_id: recipientUserId,
      content: body,
      read: false,
    })
  } catch { /* non-fatal */ }
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const [{ data: cand }, { data: emp }] = await Promise.all([
      admin.from('candidate_profiles').select('id, full_name, user_id').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('id, company_name, property_name, user_id').eq('user_id', user.id).maybeSingle(),
    ])

    const rows: any[] = []
    if (cand) {
      const { data } = await admin.from('agency_bookings').select('*').eq('candidate_id', cand.id).order('created_at', { ascending: false })
      rows.push(...(data || []))
    }
    if (emp) {
      const { data } = await admin.from('agency_bookings').select('*').eq('employer_id', emp.id).order('created_at', { ascending: false })
      rows.push(...(data || []))
    }
    // De-duplicate (a user could in theory hold both profiles)
    const seen = new Set<string>()
    const bookings = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))

    // Enrich with the other party's display name via separate lookups (no FK embeds)
    const empIds = Array.from(new Set(bookings.map(b => b.employer_id).filter(Boolean)))
    const candIds = Array.from(new Set(bookings.map(b => b.candidate_id).filter(Boolean)))
    // Employer select includes commute info; if those columns haven't been
    // added to the live DB yet, PostgREST rejects the WHOLE query, so fall
    // back to the base column set rather than blanking the page.
    const fetchEmployers = async (): Promise<{ data: any[] | null }> => {
      if (!empIds.length) return { data: [] as any[] }
      const full = await admin.from('employer_profiles')
        .select('id, user_id, company_name, property_name, location, postcode, commute_car_required, nearest_transport, latitude, longitude')
        .in('id', empIds)
      if (!full.error) return full
      return admin.from('employer_profiles').select('id, user_id, company_name, property_name, location').in('id', empIds)
    }
    const fetchCandidates = async (): Promise<{ data: any[] | null }> => {
      if (!candIds.length) return { data: [] as any[] }
      const full = await admin.from('candidate_profiles')
        .select('id, user_id, full_name, latitude, longitude, travel_radius_miles')
        .in('id', candIds)
      if (!full.error) return full
      return admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candIds)
    }
    const [empsRes, candsRes] = await Promise.all([fetchEmployers(), fetchCandidates()])
    const empMap = new Map((empsRes.data || []).map((e: any) => [e.id, e]))
    const candMap = new Map((candsRes.data || []).map((c: any) => [c.id, c]))

    const enriched = bookings
      .map(b => {
        // Real miles between the candidate's home and the property, when both
        // postcodes have been geocoded. Null = unknown, shown as such.
        const dist = profileDistanceMiles(candMap.get(b.candidate_id) || {}, empMap.get(b.employer_id) || {})
        const radius = candMap.get(b.candidate_id)?.travel_radius_miles ?? null
        return {
        ...b,
        distance_miles: dist != null ? Math.round(dist * 10) / 10 : null,
        candidate_travel_radius: radius,
        within_radius: dist != null && radius ? dist <= radius : null,
        employer_name: employerDisplayName(empMap.get(b.employer_id)),
        employer_user_id: empMap.get(b.employer_id)?.user_id || null, // for reviews
        employer_location: empMap.get(b.employer_id)?.location || null,
        employer_postcode: empMap.get(b.employer_id)?.postcode || null,
        commute_car_required: empMap.get(b.employer_id)?.commute_car_required ?? null,
        nearest_transport: empMap.get(b.employer_id)?.nearest_transport || null,
        candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
        candidate_user_id: candMap.get(b.candidate_id)?.user_id || null, // for reviews
        viewer_role: emp && b.employer_id === emp.id ? 'employer' : 'candidate',
      }})
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    return NextResponse.json({ bookings: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const body = await req.json()
    const action = body.action
    if (!['create', 'counter', 'accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const admin = createAdminClient()
    const [{ data: cand }, { data: emp }] = await Promise.all([
      admin.from('candidate_profiles').select('id, full_name, user_id').eq('user_id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    // ── create: employer sends an offer to a candidate ──
    // Rates are HOURLY. The therapist receives rate × hours in full; WHC's
    // platform fee is calculated on top and payable by the property.
    if (action === 'create') {
      if (!emp) return NextResponse.json({ error: 'Only employers can make offers' }, { status: 403 })
      // Agency cover is a Preferred Employer benefit (£150/year registration)
      if (!emp.preferred_employer) {
        return NextResponse.json({ error: 'Agency bookings are for registered Preferred Employers. Register from your Agency Bookings page (£150/year) to book cover.' }, { status: 403 })
      }
      const rate = parseInt(String(body.rate), 10)
      if (!body.candidateId || !rate || rate <= 0) {
        return NextResponse.json({ error: 'A candidate and a valid hourly rate are required' }, { status: 400 })
      }
      if (!body.shiftDate) {
        return NextResponse.json({ error: 'A shift date is required' }, { status: 400 })
      }

      const { data: targetCand } = await admin
        .from('candidate_profiles')
        .select('id, full_name, user_id, phone')
        .eq('id', body.candidateId)
        .maybeSingle()
      if (!targetCand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

      const hours = body.hours ? parseInt(String(body.hours), 10) : null
      const effectiveHours = hours && hours > 0 ? hours : 8
      const platformFee = Math.ceil(rate * effectiveHours * AGENCY_PLATFORM_FEE_PCT)

      // Same-day offers are URGENT (sickness cover): tighter expiry + SMS.
      const urgent = String(body.shiftDate) === todayInLondon()
      const expiresAt = new Date(Date.now() + (urgent ? URGENT_EXPIRY_MS : STANDARD_EXPIRY_MS)).toISOString()

      const row: Record<string, any> = {
        candidate_id: targetCand.id,
        employer_id: emp.id,
        shift_date: body.shiftDate,
        shift_type: body.shiftType || null,
        hours: hours && hours > 0 ? hours : null,
        rate,
        platform_fee: platformFee,
        status: 'pending',
        urgent,
        expires_at: expiresAt,
      }

      const { data: booking, error } = await insertBookingDefensively(admin, row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const empName = employerDisplayName(emp)
      const offerBody = urgent
        ? `URGENT: ${empName} needs cover TODAY and has offered you a shift at £${rate} per hour${hours ? ` (${hours} hours - £${rate * hours} total)` : ''}. This offer expires in 4 hours - accept, decline or counter from your Agency page now.`
        : `${empName} has offered you an agency shift on ${body.shiftDate} at £${rate} per hour${hours ? ` (${hours} hours - £${rate * hours} total)` : ''}. You can accept, decline or counter from your Agency page.`

      // Bell + inbox
      await notifyOtherParty(
        admin, targetCand.user_id, user.id,
        urgent ? 'URGENT: shift offer for today' : 'New agency offer',
        offerBody,
        '/talent/agency',
      )

      // Email + (for urgent offers) SMS — all awaited: fire-and-forget dies
      // on serverless. None of these may fail the offer itself.
      try {
        const jobs: Promise<unknown>[] = []
        if (targetCand.user_id) {
          const { data: candUser } = await admin.auth.admin.getUserById(targetCand.user_id)
          const candEmail = candUser?.user?.email
          if (candEmail) {
            jobs.push(sendAgencyOfferEmail(candEmail, targetCand.full_name || 'there', {
              propertyName: empName,
              shiftDate: body.shiftDate,
              rate,
              hours,
              urgent,
              expiresAt,
            }))
          }
        }
        if (urgent) {
          jobs.push(sendSms(
            targetCand.phone,
            `WHC Concierge: ${empName} needs cover TODAY - £${rate}/hr${hours ? ` for ${hours}h` : ''}. Offer expires in 4 hrs. Accept or counter: https://talent.wellnesshousecollective.co.uk/talent/agency`,
          ))
        }
        await Promise.allSettled(jobs)
      } catch (e: any) {
        console.error('Agency offer alerts failed:', e?.message)
      }

      return NextResponse.json({ success: true, booking })
    }

    // ── counter / accept / decline all operate on an existing booking ──
    if (!body.bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
    const { data: booking } = await admin.from('agency_bookings').select('*').eq('id', body.bookingId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCandidateParty = !!cand && booking.candidate_id === cand.id
    const isEmployerParty = !!emp && booking.employer_id === emp.id
    if (!isCandidateParty && !isEmployerParty) {
      return NextResponse.json({ error: 'You are not part of this booking' }, { status: 403 })
    }
    if (!OPEN_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: `This offer has already been ${booking.status}` }, { status: 400 })
    }

    // Expired offers can no longer be actioned — mark them so both sides see it.
    if (isExpired(booking)) {
      await admin.from('agency_bookings').update({ status: 'expired' }).eq('id', booking.id).in('status', OPEN_STATUSES)
      return NextResponse.json({ error: 'This offer has expired. Ask the property to send a new one if the shift is still available.' }, { status: 400 })
    }

    // Work out who to notify (the other party's auth user id and display name)
    const [{ data: bookingEmp }, { data: bookingCand }] = await Promise.all([
      admin.from('employer_profiles').select('id, company_name, property_name, user_id').eq('id', booking.employer_id).maybeSingle(),
      admin.from('candidate_profiles').select('id, full_name, user_id').eq('id', booking.candidate_id).maybeSingle(),
    ])
    const otherUserId = isCandidateParty ? bookingEmp?.user_id : bookingCand?.user_id
    const otherLink = isCandidateParty ? `/agency/${booking.candidate_id}` : '/talent/agency'
    const actorName = isCandidateParty
      ? (bookingCand?.full_name || 'The candidate')
      : employerDisplayName(bookingEmp)
    const shiftDate = booking.shift_date || 'the agreed date'

    if (action === 'counter') {
      if (!isCandidateParty) {
        return NextResponse.json({ error: 'Only the candidate can counter an offer' }, { status: 403 })
      }
      const rate = parseInt(String(body.rate), 10)
      if (!rate || rate <= 0) return NextResponse.json({ error: 'A valid counter rate is required' }, { status: 400 })

      // Recalculate the platform fee against the countered hourly rate
      const counterFee = Math.ceil(rate * (booking.hours && booking.hours > 0 ? booking.hours : 8) * AGENCY_PLATFORM_FEE_PCT)
      const { data: updated, error } = await admin
        .from('agency_bookings')
        .update({ rate, platform_fee: counterFee, status: 'countered' })
        .eq('id', booking.id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notifyOtherParty(
        admin, otherUserId, user.id,
        'Counter-offer received',
        `${actorName} has countered your agency offer for ${shiftDate} with a rate of £${rate} per hour. You can accept or decline from their profile page.`,
        otherLink,
      )
      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'accept') {
      // Conditional update: only flips an offer that is still open, so two
      // simultaneous accepts (or an accept racing a decline) can't both win.
      const { data: updated, error } = await admin
        .from('agency_bookings')
        .update({ status: 'accepted' })
        .eq('id', booking.id)
        .in('status', OPEN_STATUSES)
        .select('*')
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!updated) return NextResponse.json({ error: 'This offer is no longer open - it may have just been actioned elsewhere.' }, { status: 409 })

      const effHours = booking.hours && booking.hours > 0 ? booking.hours : 8
      const totalDue = booking.rate * effHours + (updated.platform_fee || Math.ceil(booking.rate * effHours * AGENCY_PLATFORM_FEE_PCT))
      const acceptBody = isCandidateParty
        // Candidate accepted → the property now pays WHC in full to confirm
        ? `${actorName} has accepted the agency offer for ${shiftDate} at £${booking.rate} per hour. To confirm the booking, pay £${totalDue} (rate plus the 10% WHC fee) from your Agency Bookings page. WHC pays the therapist after the shift.`
        : `${actorName} has accepted the agency offer for ${shiftDate} at £${booking.rate} per hour. The booking is confirmed once payment is made.`
      await notifyOtherParty(
        admin, otherUserId, user.id,
        'Agency offer accepted',
        acceptBody,
        isCandidateParty ? '/employer/agency' : otherLink,
      )
      return NextResponse.json({ success: true, booking: updated })
    }

    // action === 'decline'
    const { data: updated, error } = await admin
      .from('agency_bookings')
      .update({ status: 'declined' })
      .eq('id', booking.id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await notifyOtherParty(
      admin, otherUserId, user.id,
      'Agency offer declined',
      `${actorName} has declined the agency offer for ${shiftDate}.`,
      otherLink,
    )
    return NextResponse.json({ success: true, booking: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
