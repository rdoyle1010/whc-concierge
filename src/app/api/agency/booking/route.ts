import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'

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
    const [empsRes, candsRes] = await Promise.all([
      empIds.length ? admin.from('employer_profiles').select('id, user_id, company_name, property_name, location').in('id', empIds) : Promise.resolve({ data: [] as any[] }),
      candIds.length ? admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candIds) : Promise.resolve({ data: [] as any[] }),
    ])
    const empMap = new Map((empsRes.data || []).map((e: any) => [e.id, e]))
    const candMap = new Map((candsRes.data || []).map((c: any) => [c.id, c]))

    const enriched = bookings
      .map(b => ({
        ...b,
        employer_name: employerDisplayName(empMap.get(b.employer_id)),
        employer_user_id: empMap.get(b.employer_id)?.user_id || null, // for reviews
        candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
        candidate_user_id: candMap.get(b.candidate_id)?.user_id || null, // for reviews
        viewer_role: emp && b.employer_id === emp.id ? 'employer' : 'candidate',
      }))
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
      admin.from('employer_profiles').select('id, company_name, property_name, user_id').eq('user_id', user.id).maybeSingle(),
    ])

    // ── create: employer sends an offer to a candidate ──
    // Rates are HOURLY. The therapist receives rate × hours in full; WHC's
    // platform fee is calculated on top and payable by the property.
    if (action === 'create') {
      if (!emp) return NextResponse.json({ error: 'Only employers can make offers' }, { status: 403 })
      const rate = parseInt(String(body.rate), 10)
      if (!body.candidateId || !rate || rate <= 0) {
        return NextResponse.json({ error: 'A candidate and a valid hourly rate are required' }, { status: 400 })
      }
      if (!body.shiftDate) {
        return NextResponse.json({ error: 'A shift date is required' }, { status: 400 })
      }

      const { data: targetCand } = await admin
        .from('candidate_profiles')
        .select('id, full_name, user_id')
        .eq('id', body.candidateId)
        .maybeSingle()
      if (!targetCand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

      const hours = body.hours ? parseInt(String(body.hours), 10) : null
      const effectiveHours = hours && hours > 0 ? hours : 8
      const platformFee = Math.ceil(rate * effectiveHours * AGENCY_PLATFORM_FEE_PCT)
      const row: Record<string, any> = {
        candidate_id: targetCand.id,
        employer_id: emp.id,
        shift_date: body.shiftDate,
        shift_type: body.shiftType || null,
        hours: hours && hours > 0 ? hours : null,
        rate,
        platform_fee: platformFee,
        status: 'pending',
      }

      const { data: booking, error } = await insertBookingDefensively(admin, row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const empName = employerDisplayName(emp)
      await notifyOtherParty(
        admin, targetCand.user_id, user.id,
        'New agency offer',
        `${empName} has offered you an agency shift on ${body.shiftDate} at £${rate} per hour${hours ? ` (${hours} hours — £${rate * hours} total)` : ''}. You can accept, decline or counter from your Agency page.`,
        '/talent/agency',
      )
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
      const { data: updated, error } = await admin
        .from('agency_bookings')
        .update({ status: 'accepted' })
        .eq('id', booking.id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notifyOtherParty(
        admin, otherUserId, user.id,
        'Agency offer accepted',
        `${actorName} has accepted the agency offer for ${shiftDate} at £${booking.rate} per hour. The shift is now confirmed.`,
        otherLink,
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
