import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { AGENCY_PLATFORM_FEE_PCT, agencyFeePctForShift, agencyFeePctForShiftPlus } from '@/lib/constants'

// Agency Plus members pay a reduced base fee. Judged at booking time so the
// subscription state on the day of booking decides the fee that is stored.
async function feePctForEmployerShift(admin: any, employerId: string | null | undefined, shiftDate: string | null | undefined): Promise<number> {
  let plus = false
  try {
    if (employerId) {
      const { data } = await admin.from('employer_profiles')
        .select('agency_plus_active, agency_plus_until').eq('id', employerId).maybeSingle()
      plus = Boolean(data?.agency_plus_active) && (!data?.agency_plus_until || new Date(data.agency_plus_until).getTime() > Date.now())
    }
  } catch { /* fee falls back to standard */ }
  return agencyFeePctForShiftPlus(shiftDate, todayInLondon(), plus)
}
import { sendSms } from '@/lib/sms'
import { sendAgencyOfferEmail, sendReviewRequestEmail, sendInsuranceExpiryEmail, sendAgencyUpdateEmail, sendFeaturedExpiringEmail } from '@/lib/emails'
import { profileDistanceMiles } from '@/lib/geo'
import { shiftHours, validShiftWindow, windowCovers, windowsOverlap } from '@/lib/agency-time'

// Offers expire so urgent cover doesn't sit unanswered while the property
// waits: 4 hours for same-day (urgent) shifts, 48 hours otherwise.
const URGENT_EXPIRY_MS = 4 * 60 * 60 * 1000
const STANDARD_EXPIRY_MS = 48 * 60 * 60 * 1000

// Urgent CASCADE: the offer walks down a queue of nearby available therapists.
// Each holder gets 30 minutes before it moves to the next; the whole cascade
// gives up after 4 hours (or when the queue runs dry) and tells the property.
const CASCADE_WINDOW_MS = 30 * 60 * 1000
const CASCADE_TOTAL_MS = URGENT_EXPIRY_MS
const CASCADE_MAX_QUEUE = 10

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

async function getAuthedUser() {
  const cookieStore = await cookies()
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
      // Timed shifts must fail closed. Silently dropping these fields would
      // create a booking that cannot be protected from overlaps.
      if (m[1] === 'shift_start_time' || m[1] === 'shift_end_time') break
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

async function candidateCanWork(admin: any, candidateId: string, date: string, start: string, end: string) {
  const { data: windows, error } = await admin.from('agency_availability_windows')
    .select('start_time, end_time').eq('candidate_id', candidateId).eq('date', date)
  if (error) return { ok: false, error: 'Availability could not be checked' }
  const covered = (windows || []).some((w: any) => windowCovers(String(w.start_time).slice(0, 5), String(w.end_time).slice(0, 5), start, end))
  if (!covered) return { ok: false, error: 'This professional has not confirmed availability for the full shift.' }

  const { data: bookings, error: bookingError } = await admin.from('agency_bookings')
    .select('shift_start_time, shift_end_time').eq('candidate_id', candidateId).eq('shift_date', date)
    .in('status', ['pending', 'countered', 'accepted', 'confirmed'])
  if (bookingError) return { ok: false, error: 'Existing bookings could not be checked' }
  const busy = (bookings || []).some((b: any) => !b.shift_start_time || !b.shift_end_time || windowsOverlap(
    String(b.shift_start_time).slice(0, 5), String(b.shift_end_time).slice(0, 5), start, end,
  ))
  return busy ? { ok: false, error: 'This professional is already booked or considering an overlapping shift.' } : { ok: true }
}

// Notify the other party in-app, drop the same note into their inbox, and
// (unless the caller sends its own richer email) email them too - offers
// expire, so a party who isn't watching the dashboard must still hear.
async function notifyOtherParty(
  admin: any,
  recipientUserId: string | null | undefined,
  senderUserId: string,
  title: string,
  body: string,
  link: string,
  sendEmailToo = true,
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
  if (sendEmailToo) {
    try {
      const { data: u } = await admin.auth.admin.getUserById(recipientUserId)
      const em = u?.user?.email
      if (em) await sendAgencyUpdateEmail(em, 'there', title, body, link)
    } catch { /* non-fatal */ }
  }
}

// Tell a candidate they now hold an urgent cascade offer: bell + inbox +
// email + SMS, all awaited (fire-and-forget dies on serverless), none fatal.
async function alertCascadeHolder(
  admin: any,
  candidate: { user_id?: string | null; full_name?: string | null; phone?: string | null },
  empName: string,
  empUserId: string,
  b: { shift_date: string; rate: number; hours: number | null; expires_at: string },
) {
  const mins = Math.max(1, Math.round((new Date(b.expires_at).getTime() - Date.now()) / 60000))
  const body = `URGENT: ${empName} needs cover TODAY and has offered you a shift at £${b.rate} per hour${b.hours ? ` (${b.hours} hours - £${b.rate * b.hours} total)` : ''}. You have ${mins} minutes before the offer moves to the next therapist - accept now from your Agency page.`
  // sendEmailToo=false: the richer offer email (+ SMS) is sent just below
  await notifyOtherParty(admin, candidate.user_id, empUserId, 'URGENT: shift offer for today', body, '/talent/agency', false)
  try {
    const jobs: Promise<unknown>[] = []
    if (candidate.user_id) {
      const { data: candUser } = await admin.auth.admin.getUserById(candidate.user_id)
      const candEmail = candUser?.user?.email
      if (candEmail) {
        jobs.push(sendAgencyOfferEmail(candEmail, candidate.full_name || 'there', {
          propertyName: empName, shiftDate: b.shift_date, rate: b.rate, hours: b.hours, urgent: true, expiresAt: b.expires_at,
        }))
      }
    }
    jobs.push(sendSms(
      candidate.phone,
      `WHC Concierge: ${empName} needs cover TODAY - £${b.rate}/hr${b.hours ? ` for ${b.hours}h` : ''}. You have ${mins} mins before this offer moves on. Accept: https://talent.wellnesshousecollective.co.uk/talent/agency`,
    ))
    await Promise.allSettled(jobs)
  } catch (e: any) { console.error('Cascade alert failed:', e?.message) }
}

// Move a cascade offer to the next therapist in the queue. Guarded by a
// conditional update on cascade_index so two concurrent sweeps (or a decline
// racing a sweep) can't double-advance. Returns the updated booking, or null
// if the cascade ended (expired / exhausted / already moved by someone else).
async function advanceCascade(admin: any, booking: any): Promise<any | null> {
  const queue: any[] = Array.isArray(booking.cascade_queue) ? booking.cascade_queue : []
  const idx = booking.cascade_index ?? 0
  const startedAt = booking.created_at ? new Date(booking.created_at).getTime() : Date.now()

  const { data: bookingEmp } = await admin.from('employer_profiles')
    .select('id, company_name, property_name, user_id').eq('id', booking.employer_id).maybeSingle()
  const empName = employerDisplayName(bookingEmp)

  const giveUp = async (why: string) => {
    const { data: ended } = await admin.from('agency_bookings')
      .update({ status: 'expired' })
      .eq('id', booking.id)
      .eq('cascade_index', idx)
      .in('status', OPEN_STATUSES)
      .select('id')
      .maybeSingle()
    if (ended && bookingEmp?.user_id) {
      const giveUpBody = `We couldn't fill your urgent shift on ${booking.shift_date} - ${why}. You can send a new request, widen the rate, or book someone directly from the agency directory.`
      try {
        await createNotification(bookingEmp.user_id, 'general', 'Urgent cover not filled', giveUpBody, '/employer/agency')
      } catch { /* non-fatal */ }
      try {
        const { data: u } = await admin.auth.admin.getUserById(bookingEmp.user_id)
        if (u?.user?.email) await sendAgencyUpdateEmail(u.user.email, 'there', 'Urgent cover not filled', giveUpBody, '/employer/agency')
      } catch { /* non-fatal */ }
    }
    return null
  }

  if (Date.now() - startedAt > CASCADE_TOTAL_MS) return giveUp('the 4-hour window ran out')
  const next = idx + 1
  if (next >= queue.length) return giveUp(`all ${queue.length} matching therapists were offered it`)

  const entry = queue[next]
  const hours = booking.hours && booking.hours > 0 ? booking.hours : null
  const effHours = hours || 8
  const rate = parseInt(String(entry.rate), 10) || booking.rate
  const deadline = new Date(Date.now() + CASCADE_WINDOW_MS).toISOString()

  const { data: updated } = await admin.from('agency_bookings')
    .update({
      candidate_id: entry.id,
      rate,
      platform_fee: Math.ceil(rate * effHours * await feePctForEmployerShift(admin, booking.employer_id, booking.shift_date)),
      status: 'pending',
      cascade_index: next,
      cascade_deadline: deadline,
      expires_at: deadline,
    })
    .eq('id', booking.id)
    .eq('cascade_index', idx)
    .in('status', OPEN_STATUSES)
    .select('*')
    .maybeSingle()
  if (!updated) return null // someone else advanced or the offer closed - do not notify

  const { data: nextCand } = await admin.from('candidate_profiles')
    .select('id, full_name, user_id, phone').eq('id', entry.id).maybeSingle()
  if (nextCand && bookingEmp?.user_id) {
    await alertCascadeHolder(admin, nextCand, empName, bookingEmp.user_id, {
      shift_date: booking.shift_date, rate, hours, expires_at: deadline,
    })
  }
  return updated
}

// Lazy maintenance sweep, run whenever agency data loads. Belt-and-braces
// behind the Stripe webhooks: expires stale offers, and lapses register
// listings / Preferred Employer status whose renewal date passed more than
// 3 days ago (grace window for webhook timing). Grandfathered accounts have
// NULL dates and are never touched. All best-effort.
async function maintenanceSweep(admin: any) {
  const now = new Date().toISOString()
  const grace = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  // Cascade offers whose holder's window lapsed move to the next therapist
  // BEFORE the generic expiry pass (which would otherwise kill them).
  try {
    const { data: stale } = await admin.from('agency_bookings')
      .select('*')
      .in('status', OPEN_STATUSES)
      .not('cascade_queue', 'is', null)
      .lt('cascade_deadline', now)
      .limit(20)
    for (const b of stale || []) await advanceCascade(admin, b)
  } catch { /* cascade columns may not exist yet - never fatal */ }
  await Promise.allSettled([
    admin.from('agency_bookings').update({ status: 'expired' }).in('status', OPEN_STATUSES).lt('expires_at', now),
    admin.from('candidate_profiles').update({ agency_available: false }).eq('agency_available', true).not('agency_listed_until', 'is', null).lt('agency_listed_until', grace),
    admin.from('employer_profiles').update({ preferred_employer: false }).eq('preferred_employer', true).not('preferred_until', 'is', null).lt('preferred_until', grace),
  ])

  const todayLondon = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

  // ── Post-shift review requests ──
  // The day after a paid shift, both sides get one nudge to review each
  // other. Claimed row-by-row (conditional update) so concurrent sweeps
  // never double-send. Small batches; the sweep runs on every agency load.
  try {
    const { data: doneShifts } = await admin.from('agency_bookings')
      .select('id, candidate_id, employer_id, shift_date, review_requested')
      .eq('status', 'confirmed')
      .not('paid_at', 'is', null)
      .lt('shift_date', todayLondon)
      .or('review_requested.is.null,review_requested.eq.false')
      .limit(5)
    for (const b of doneShifts || []) {
      const { data: claimed } = await admin.from('agency_bookings')
        .update({ review_requested: true })
        .eq('id', b.id)
        .or('review_requested.is.null,review_requested.eq.false')
        .select('id')
        .maybeSingle()
      if (!claimed) continue
      const [{ data: c }, { data: e }] = await Promise.all([
        admin.from('candidate_profiles').select('user_id, full_name').eq('id', b.candidate_id).maybeSingle(),
        admin.from('employer_profiles').select('user_id, company_name, property_name').eq('id', b.employer_id).maybeSingle(),
      ])
      const empName = employerDisplayName(e)
      const candName = c?.full_name || 'the therapist'
      const jobs: Promise<unknown>[] = []
      if (c?.user_id) {
        jobs.push(createNotification(c.user_id, 'general', 'How was your shift?',
          `How was your shift at ${empName} on ${b.shift_date}? Leave a review - properties with reviews book faster, and so do therapists.`, '/talent/agency'))
        jobs.push(admin.auth.admin.getUserById(c.user_id).then(({ data }: any) => {
          const email = data?.user?.email
          return email ? sendReviewRequestEmail(email, c.full_name || 'there', empName) : null
        }))
      }
      if (e?.user_id) {
        jobs.push(createNotification(e.user_id, 'general', 'How did the shift go?',
          `How did ${candName}'s shift on ${b.shift_date} go? Leave a review to help other properties - and keep your own score strong.`, '/employer/agency'))
        jobs.push(admin.auth.admin.getUserById(e.user_id).then(({ data }: any) => {
          const email = data?.user?.email
          return email ? sendReviewRequestEmail(email, empName, candName) : null
        }))
      }
      await Promise.allSettled(jobs)
    }
  } catch { /* review nudges are never fatal */ }

  // ── Insurance expiry chasing (WHC Verified) ──
  try {
    // Expired → badge paused, therapist told how to get it back
    const { data: lapsed } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name, insurance_expiry_date')
      .eq('whc_verified', true)
      .not('insurance_expiry_date', 'is', null)
      .lt('insurance_expiry_date', todayLondon)
      .limit(5)
    for (const c of lapsed || []) {
      await admin.from('candidate_profiles')
        .update({ whc_verified: false, verification_status: 'lapsed' })
        .eq('id', c.id).eq('whc_verified', true)
      if (c.user_id) {
        try {
          await createNotification(c.user_id, 'general', 'WHC Verified badge paused',
            `Your insurance expired on ${c.insurance_expiry_date} so your badge is paused. Upload your renewal from the Verification page and it comes straight back after review.`, '/talent/verification')
          const { data: u } = await admin.auth.admin.getUserById(c.user_id)
          if (u?.user?.email) await sendInsuranceExpiryEmail(u.user.email, c.full_name || 'there', c.insurance_expiry_date, true)
        } catch { /* non-fatal */ }
      }
    }
    // Expiring within 30 days → chased at most once every 10 days
    const soon = new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
    const { data: expiring } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name, insurance_expiry_date, insurance_chased_at')
      .eq('whc_verified', true)
      .not('insurance_expiry_date', 'is', null)
      .gte('insurance_expiry_date', todayLondon)
      .lte('insurance_expiry_date', soon)
      .limit(10)
    for (const c of expiring || []) {
      if (c.insurance_chased_at && Date.now() - new Date(c.insurance_chased_at).getTime() < 10 * 86400000) continue
      await admin.from('candidate_profiles').update({ insurance_chased_at: new Date().toISOString() }).eq('id', c.id)
      if (c.user_id) {
        try {
          await createNotification(c.user_id, 'general', 'Your insurance expires soon',
            `Your insurance expires on ${c.insurance_expiry_date}. Upload your renewal from the Verification page and your WHC Verified badge carries straight on.`, '/talent/verification')
          const { data: u } = await admin.auth.admin.getUserById(c.user_id)
          if (u?.user?.email) await sendInsuranceExpiryEmail(u.user.email, c.full_name || 'there', c.insurance_expiry_date, false)
        } catch { /* non-fatal */ }
      }
    }
  } catch { /* chasing is never fatal */ }

  // ── Featured profile expiry warning ──
  // 3-day heads-up before a paid featured slot lapses, so the renewal nudge
  // actually happens (the webhook only ever revokes). Deduped through the
  // notifications table - at most one nudge per profile per week, and the
  // matching window is only 3 days wide - so no new column is needed.
  try {
    const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString()
    const { data: expiringFeatured } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name, featured_until')
      .eq('is_featured', true)
      .not('featured_until', 'is', null)
      .gte('featured_until', now)
      .lte('featured_until', inThreeDays)
      .limit(10)
    for (const c of expiringFeatured || []) {
      if (!c.user_id) continue
      const { data: alreadySent } = await admin.from('notifications')
        .select('id')
        .eq('user_id', c.user_id)
        .eq('title', 'Your featured profile expires soon')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1)
        .maybeSingle()
      if (alreadySent) continue
      try {
        await createNotification(c.user_id, 'general', 'Your featured profile expires soon',
          `Your featured profile expires on ${String(c.featured_until).slice(0, 10)}. Renew from your Billing page to keep your premium visibility.`, '/talent/billing')
        const { data: u } = await admin.auth.admin.getUserById(c.user_id)
        if (u?.user?.email) await sendFeaturedExpiringEmail(u.user.email, c.full_name || 'there')
      } catch { /* non-fatal */ }
    }
  } catch { /* featured nudges are never fatal */ }
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    await maintenanceSweep(admin)
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
        .select('id, user_id, company_name, property_name, location, postcode, commute_car_required, nearest_transport, transport_walk_minutes, parking_available, taxi_support, taxi_notes, travel_notes, latitude, longitude, review_score, review_count')
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
        employer_review_score: empMap.get(b.employer_id)?.review_score ?? null,
        employer_review_count: empMap.get(b.employer_id)?.review_count ?? null,
        employer_postcode: empMap.get(b.employer_id)?.postcode || null,
        commute_car_required: empMap.get(b.employer_id)?.commute_car_required ?? null,
        nearest_transport: empMap.get(b.employer_id)?.nearest_transport || null,
        transport_walk_minutes: empMap.get(b.employer_id)?.transport_walk_minutes ?? null,
        parking_available: empMap.get(b.employer_id)?.parking_available ?? null,
        taxi_support: empMap.get(b.employer_id)?.taxi_support ?? null,
        taxi_notes: empMap.get(b.employer_id)?.taxi_notes || null,
        travel_notes: empMap.get(b.employer_id)?.travel_notes || null,
        candidate_name: candMap.get(b.candidate_id)?.full_name || 'Candidate',
        candidate_user_id: candMap.get(b.candidate_id)?.user_id || null, // for reviews
        cascade_total: Array.isArray(b.cascade_queue) ? b.cascade_queue.length : null,
        cascade_position: Array.isArray(b.cascade_queue) ? (b.cascade_index ?? 0) + 1 : null,
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
    if (!['create', 'counter', 'accept', 'accept_group', 'decline', 'dispute', 'urgent_cascade'].includes(action)) {
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
      const shiftStartTime = String(body.shiftStartTime || '')
      const shiftEndTime = String(body.shiftEndTime || '')
      if (!validShiftWindow(String(body.shiftDate), shiftStartTime, shiftEndTime)) {
        return NextResponse.json({ error: 'A valid shift start and finish time are required' }, { status: 400 })
      }

      const { data: targetCand } = await admin
        .from('candidate_profiles')
        .select('id, full_name, user_id, phone, approval_status, profile_visible, agency_available, agency_listed_until, latitude, longitude, travel_radius_miles')
        .eq('id', body.candidateId)
        .maybeSingle()
      if (!targetCand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      if (targetCand.approval_status !== 'approved' || targetCand.profile_visible === false || !targetCand.agency_available) {
        return NextResponse.json({ error: 'This professional is not currently bookable on the agency register.' }, { status: 403 })
      }
      if (targetCand.agency_listed_until && new Date(targetCand.agency_listed_until).getTime() < Date.now()) {
        return NextResponse.json({ error: 'This professional’s agency registration has expired.' }, { status: 403 })
      }
      const { data: block } = await admin.from('profile_blocks').select('id').eq('candidate_id', targetCand.id).eq('blocked_employer_id', emp.id).maybeSingle()
      if (block) return NextResponse.json({ error: 'This profile is not available to your property.' }, { status: 403 })
      const distance = profileDistanceMiles(targetCand, emp)
      if (targetCand.travel_radius_miles && (distance == null || distance > targetCand.travel_radius_miles)) {
        return NextResponse.json({ error: 'This shift is outside the professional’s travel radius.' }, { status: 400 })
      }
      const workCheck = await candidateCanWork(admin, targetCand.id, String(body.shiftDate), shiftStartTime, shiftEndTime)
      if (!workCheck.ok) return NextResponse.json({ error: workCheck.error }, { status: 409 })

      const hours = shiftHours(shiftStartTime, shiftEndTime) || 0
      const effectiveHours = hours || 8
      const platformFee = Math.ceil(rate * effectiveHours * await feePctForEmployerShift(admin, emp.id, String(body.shiftDate)))

      // Same-day offers are URGENT (sickness cover): tighter expiry + SMS.
      const urgent = String(body.shiftDate) === todayInLondon()
      const expiresAt = new Date(Date.now() + (urgent ? URGENT_EXPIRY_MS : STANDARD_EXPIRY_MS)).toISOString()

      // Standing bookings: the same offer repeated weekly on the same weekday,
      // tied together by booking_group so the therapist can accept the lot.
      const repeatWeeks = Math.min(8, Math.max(1, parseInt(String(body.repeatWeeks || '1'), 10) || 1))
      const repeatDates: string[] = []
      for (let w = 1; w < repeatWeeks; w++) {
        const d = new Date(`${body.shiftDate}T12:00:00Z`)
        d.setUTCDate(d.getUTCDate() + 7 * w)
        const repeatDate = d.toISOString().slice(0, 10)
        const repeatCheck = await candidateCanWork(admin, targetCand.id, repeatDate, shiftStartTime, shiftEndTime)
        if (!repeatCheck.ok) return NextResponse.json({ error: `Week ${w + 1}: ${repeatCheck.error}` }, { status: 409 })
        repeatDates.push(repeatDate)
      }
      const groupId = repeatWeeks > 1
        ? (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : null)
        : null

      const baseRow: Record<string, any> = {
        candidate_id: targetCand.id,
        employer_id: emp.id,
        shift_date: body.shiftDate,
        shift_start_time: shiftStartTime,
        shift_end_time: shiftEndTime,
        shift_type: body.shiftType || null,
        hours: hours && hours > 0 ? hours : null,
        rate,
        platform_fee: platformFee,
        status: 'pending',
        urgent,
        expires_at: expiresAt,
      }
      if (groupId) baseRow.booking_group = groupId

      const { data: booking, error } = await insertBookingDefensively(admin, baseRow)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Weeks 2..N - future dates, never urgent, standard expiry. Failures
      // here don't kill the first offer; they're just logged.
      let createdCount = 1
      if (groupId && booking?.booking_group) {
        for (const repeatDate of repeatDates) {
          const { error: repErr } = await insertBookingDefensively(admin, {
            ...baseRow,
            shift_date: repeatDate,
            urgent: false,
            expires_at: new Date(Date.now() + STANDARD_EXPIRY_MS).toISOString(),
          })
          if (repErr) console.error('Standing booking week insert failed:', repErr.message)
          else createdCount++
        }
      }

      const empName = employerDisplayName(emp)
      const standingLine = createdCount > 1
        ? ` This is a STANDING booking: ${createdCount} weekly shifts on the same weekday, starting ${body.shiftDate}. You can accept them all in one tap from your Agency page.`
        : ''
      const offerBody = urgent
        ? `URGENT: ${empName} needs cover TODAY and has offered you a shift at £${rate} per hour${hours ? ` (${hours} hours - £${rate * hours} total)` : ''}. This offer expires in 4 hours - accept, decline or counter from your Agency page now.${standingLine}`
        : `${empName} has offered you an agency shift on ${body.shiftDate} at £${rate} per hour${hours ? ` (${hours} hours - £${rate * hours} total)` : ''}. You can accept, decline or counter from your Agency page.${standingLine}`

      // Bell + inbox (sendEmailToo=false: the richer offer email is sent below)
      await notifyOtherParty(
        admin, targetCand.user_id, user.id,
        urgent ? 'URGENT: shift offer for today' : 'New agency offer',
        offerBody,
        '/talent/agency',
        false,
      )

      // Email + (for urgent offers) SMS - all awaited: fire-and-forget dies
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

      return NextResponse.json({ success: true, booking, created: createdCount })
    }

    // ── urgent_cascade: the property asks for cover and WHC finds someone ──
    // Builds a distance-sorted queue of available therapists and offers the
    // shift to them one at a time (30-minute windows) until someone accepts.
    if (action === 'urgent_cascade') {
      if (!emp) return NextResponse.json({ error: 'Only employers can request urgent cover' }, { status: 403 })
      if (!emp.preferred_employer) {
        return NextResponse.json({ error: 'Urgent cover is for registered Preferred Employers. Register from your Agency Bookings page (£150/year).' }, { status: 403 })
      }
      const shiftDate = String(body.shiftDate || todayInLondon())
      const shiftStartTime = String(body.shiftStartTime || '')
      const shiftEndTime = String(body.shiftEndTime || '')
      if (!validShiftWindow(shiftDate, shiftStartTime, shiftEndTime)) {
        return NextResponse.json({ error: 'Choose a valid shift start and finish time' }, { status: 400 })
      }
      const hours = shiftHours(shiftStartTime, shiftEndTime) || 0
      const effHours = hours || 8
      const maxRate = body.maxRate ? parseInt(String(body.maxRate), 10) : null
      const requestedRadius = body.radius ? Math.min(250, Math.max(1, parseInt(String(body.radius), 10) || 0)) : null

      // Everyone on the register with a rate set (and within the cap, if any)
      const { data: pool } = await admin.from('candidate_profiles')
        .select('id, full_name, user_id, phone, hourly_rate, latitude, longitude, travel_radius_miles, review_score, approval_status, profile_visible, agency_listed_until')
        .eq('agency_available', true)
        .not('hourly_rate', 'is', null)
      let eligible = (pool || []).filter((c: any) => c.hourly_rate > 0
        && c.approval_status === 'approved'
        && c.profile_visible !== false
        && (!c.agency_listed_until || new Date(c.agency_listed_until).getTime() >= Date.now())
        && (!maxRate || c.hourly_rate <= maxRate))

      const { data: blocked } = await admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', emp.id)
      const blockedIds = new Set((blocked || []).map((row: any) => row.candidate_id))
      eligible = eligible.filter((c: any) => !blockedIds.has(c.id))

      // Exact confirmed windows only; blank dates are never called available.
      const { data: availabilityWindows, error: availabilityError } = await admin.from('agency_availability_windows')
        .select('candidate_id, start_time, end_time').eq('date', shiftDate)
      if (availabilityError) return NextResponse.json({ error: 'Timed availability is unavailable' }, { status: 500 })
      const availableIds = new Set((availabilityWindows || []).filter((w: any) => windowCovers(
        String(w.start_time).slice(0, 5), String(w.end_time).slice(0, 5), shiftStartTime, shiftEndTime,
      )).map((w: any) => w.candidate_id))
      eligible = eligible.filter((c: any) => availableIds.has(c.id))

      // Skip anyone already holding an offer or booked that day
      try {
        const { data: busy } = await admin.from('agency_bookings')
          .select('candidate_id, shift_start_time, shift_end_time')
          .eq('shift_date', shiftDate)
          .in('status', ['pending', 'countered', 'accepted', 'confirmed'])
        const busyIds = new Set((busy || []).filter((b: any) => !b.shift_start_time || !b.shift_end_time || windowsOverlap(
          String(b.shift_start_time).slice(0, 5), String(b.shift_end_time).slice(0, 5), shiftStartTime, shiftEndTime,
        )).map((b: any) => b.candidate_id))
        eligible = eligible.filter((c: any) => !busyIds.has(c.id))
      } catch { /* non-fatal */ }

      // Distance from the property; drop anyone it's outside their own radius
      const ranked = eligible
        .map((c: any) => {
          const dist = profileDistanceMiles(c, emp)
          return { c, dist, avail: true }
        })
        .filter(({ c, dist }: any) => {
          const effectiveRadius = requestedRadius && c.travel_radius_miles
            ? Math.min(requestedRadius, c.travel_radius_miles)
            : requestedRadius || c.travel_radius_miles || null
          return !effectiveRadius || (dist != null && dist <= effectiveRadius)
        })
        .sort((a: any, b: any) => {
          if (a.avail !== b.avail) return a.avail ? -1 : 1
          const ad = a.dist ?? Infinity, bd = b.dist ?? Infinity
          if (ad !== bd) return ad - bd
          return (b.c.review_score || 0) - (a.c.review_score || 0)
        })
        .slice(0, CASCADE_MAX_QUEUE)

      if (ranked.length === 0) {
        return NextResponse.json({ error: maxRate
          ? `No available therapists found at £${maxRate}/hr or under for ${shiftDate}. Try raising the rate cap or removing it.`
          : `No available therapists found for ${shiftDate}. Try the agency directory to make a direct offer.` }, { status: 400 })
      }

      const queue = ranked.map(({ c, dist }: any) => ({
        id: c.id,
        name: c.full_name || 'Therapist',
        rate: c.hourly_rate,
        distance: dist != null ? Math.round(dist * 10) / 10 : null,
      }))
      const first = ranked[0].c
      const deadline = new Date(Date.now() + CASCADE_WINDOW_MS).toISOString()

      const row: Record<string, any> = {
        candidate_id: first.id,
        employer_id: emp.id,
        shift_date: shiftDate,
        shift_start_time: shiftStartTime,
        shift_end_time: shiftEndTime,
        shift_type: body.shiftType || null,
        hours: hours && hours > 0 ? hours : null,
        rate: first.hourly_rate,
        platform_fee: Math.ceil(first.hourly_rate * effHours * await feePctForEmployerShift(admin, emp.id, shiftDate)),
        status: 'pending',
        urgent: true,
        expires_at: deadline,
        cascade_queue: queue,
        cascade_index: 0,
        cascade_deadline: deadline,
        cascade_notes: String(body.notes || '').slice(0, 500) || null,
      }
      const { data: booking, error } = await insertBookingDefensively(admin, row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await alertCascadeHolder(admin, first, employerDisplayName(emp), user.id, {
        shift_date: shiftDate, rate: first.hourly_rate, hours, expires_at: deadline,
      })

      return NextResponse.json({ success: true, booking, queue_size: queue.length, first_name: queue[0].name })
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

    // ── dispute: the property reports a problem with a PAID booking ──
    // (no-show, left early, quality). Payout freezes until WHC resolves it;
    // any refund is minus the 10% admin fee, decided case-by-case in Admin.
    if (action === 'dispute') {
      if (!isEmployerParty) {
        return NextResponse.json({ error: 'Only the property can report an issue with a booking' }, { status: 403 })
      }
      if (!['confirmed', 'completed'].includes(booking.status) || !booking.paid_at) {
        return NextResponse.json({ error: 'Issues can be reported on paid bookings only.' }, { status: 400 })
      }
      if (booking.dispute_status === 'open') {
        return NextResponse.json({ error: 'An issue is already open on this booking - WHC is reviewing it.' }, { status: 400 })
      }
      const reason = String(body.reason || '').trim()
      if (!reason) return NextResponse.json({ error: 'Please describe what happened.' }, { status: 400 })

      const { data: updated, error } = await admin
        .from('agency_bookings')
        .update({
          dispute_status: 'open',
          dispute_reason: reason.slice(0, 1000),
          dispute_requested: String(body.requested || '').slice(0, 200) || null,
        })
        .eq('id', booking.id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notifyOtherParty(
        admin, otherUserId, user.id,
        'Issue reported on a booking',
        `${actorName} has reported an issue with the shift on ${shiftDate}. Your payout for this booking is on hold while Wellness House Collective reviews it - you'll be notified of the outcome.`,
        otherLink,
      )
      return NextResponse.json({ success: true, booking: updated })
    }

    // ── accept_group: the candidate takes every open shift in a standing
    // booking in one tap ──
    if (action === 'accept_group') {
      if (!isCandidateParty) {
        return NextResponse.json({ error: 'Only the candidate can accept a standing booking' }, { status: 403 })
      }
      if (!booking.booking_group) {
        return NextResponse.json({ error: 'This offer is not part of a standing booking' }, { status: 400 })
      }
      const { data: acceptedRows, error } = await admin
        .from('agency_bookings')
        .update({ status: 'accepted' })
        .eq('booking_group', booking.booking_group)
        .eq('candidate_id', booking.candidate_id)
        .in('status', OPEN_STATUSES)
        .select('*')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!acceptedRows || acceptedRows.length === 0) {
        return NextResponse.json({ error: 'These offers are no longer open.' }, { status: 409 })
      }
      await notifyOtherParty(
        admin, otherUserId, user.id,
        'Standing booking accepted',
        `${actorName} has accepted all ${acceptedRows.length} shifts in your standing booking (weekly from ${booking.shift_date}) at £${booking.rate} per hour. Pay each shift from your Agency Bookings page to confirm it - WHC pays the therapist after each shift.`,
        '/employer/agency',
      )
      return NextResponse.json({ success: true, accepted: acceptedRows.length })
    }

    if (!OPEN_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: `This offer has already been ${booking.status}` }, { status: 400 })
    }

    // Expired offers can no longer be actioned - mark them so both sides see
    // it. A lapsed CASCADE offer moves to the next therapist instead of dying.
    if (isExpired(booking)) {
      if (Array.isArray(booking.cascade_queue)) {
        await advanceCascade(admin, booking)
        return NextResponse.json({ error: 'This urgent offer needed a response within 30 minutes and has moved to the next therapist.' }, { status: 400 })
      }
      await admin.from('agency_bookings').update({ status: 'expired' }).eq('id', booking.id).in('status', OPEN_STATUSES)
      return NextResponse.json({ error: 'This offer has expired. Ask the property to send a new one if the shift is still available.' }, { status: 400 })
    }

    if (action === 'counter') {
      if (!isCandidateParty) {
        return NextResponse.json({ error: 'Only the candidate can counter an offer' }, { status: 403 })
      }
      const rate = parseInt(String(body.rate), 10)
      if (!rate || rate <= 0) return NextResponse.json({ error: 'A valid counter rate is required' }, { status: 400 })

      // Recalculate the platform fee against the countered hourly rate.
      // On a cascade offer the counter resets the 30-minute window so the
      // property gets a fresh clock to accept it before the queue moves on.
      const counterFee = Math.ceil(rate * (booking.hours && booking.hours > 0 ? booking.hours : 8) * await feePctForEmployerShift(admin, booking.employer_id, booking.shift_date))
      const counterUpdate: Record<string, any> = { rate, platform_fee: counterFee, status: 'countered' }
      if (Array.isArray(booking.cascade_queue)) {
        const fresh = new Date(Date.now() + CASCADE_WINDOW_MS).toISOString()
        counterUpdate.cascade_deadline = fresh
        counterUpdate.expires_at = fresh
      }
      const { data: updated, error } = await admin
        .from('agency_bookings')
        .update(counterUpdate)
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
        ? `${actorName} has accepted the agency offer for ${shiftDate} at £${booking.rate} per hour. To confirm the booking, pay £${totalDue} (rate plus the WHC fee) from your Agency Bookings page. WHC pays the therapist after the shift.`
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
    // A candidate declining a CASCADE offer passes it straight to the next
    // therapist in the queue (or ends it, telling the property, if none left).
    if (isCandidateParty && Array.isArray(booking.cascade_queue)) {
      const moved = await advanceCascade(admin, booking)
      return NextResponse.json({
        success: true,
        cascaded: Boolean(moved),
        message: moved ? 'No problem - the offer has moved to the next therapist.' : 'No problem - the property has been told the shift could not be filled.',
      })
    }
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
