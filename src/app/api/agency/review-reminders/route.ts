import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isInternalApiRequest } from '@/lib/internal-request'
import { createNotification } from '@/lib/notifications'
import { sendAgencyUpdateEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'

// Chasing the reviews that used to be demanded.
//
// The payout gate held a self-employed professional's wages until BOTH sides
// had reviewed - so a property that never got round to it froze somebody
// else's income indefinitely. The database rule now asks only for the
// professional's own review, and releases the money seven days after the shift
// whatever happens.
//
// That trade only works if the reviews still arrive, which is what this is
// for. It nudges rather than blocks: the professional is told their review
// releases their payment, because it does; the property is told their review
// helps the next property, because that is the honest reason and their review
// no longer holds anything up.
//
// Runs nightly. At most one reminder per booking every two days, and only
// within the week after the shift, so three nudges land and then it stops.
// After that the payout has released anyway and a fourth message is nagging.

const REMINDER_GAP_HOURS = 48
const WINDOW_DAYS = 8

export async function POST(req: NextRequest) {
  const admin = createAdminClient()

  if (!isInternalApiRequest(req)) {
    // An administrator may also run it by hand from the Agency panel.
    const { getRequestUser } = await import('@/lib/request-user')
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (account?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = Date.now()
  const gapCutoff = new Date(now - REMINDER_GAP_HOURS * 60 * 60 * 1000).toISOString()
  const windowStart = new Date(now - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const today = new Date(now).toISOString().slice(0, 10)

  const { data: bookings, error } = await admin.from('agency_bookings')
    .select('id,candidate_id,employer_id,shift_date,candidate_review_completed_at,employer_review_completed_at,review_reminder_last_at,paid_at,payout_status,dispute_status')
    .not('paid_at', 'is', null)
    .neq('payout_status', 'paid')
    .lte('shift_date', today)
    .gte('shift_date', windowStart)
    .or(`review_reminder_last_at.is.null,review_reminder_last_at.lt.${gapCutoff}`)
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const due = (bookings || []).filter(booking =>
    String(booking.dispute_status || '') !== 'open'
    && (!booking.candidate_review_completed_at || !booking.employer_review_completed_at))

  if (!due.length) return NextResponse.json({ checked: bookings?.length || 0, reminded: 0 })

  const candidateIds = Array.from(new Set(due.map(b => b.candidate_id).filter(Boolean)))
  const employerIds = Array.from(new Set(due.map(b => b.employer_id).filter(Boolean)))
  const [{ data: candidates }, { data: employers }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,user_id,full_name').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    employerIds.length ? admin.from('employer_profiles').select('id,user_id,company_name,property_name').in('id', employerIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const candidateById = new Map((candidates || []).map((row: any) => [row.id, row]))
  const employerById = new Map((employers || []).map((row: any) => [row.id, row]))

  // Told plainly, because a nudge that hides why it is being sent gets ignored.
  async function nudge(userId: string, name: string, subject: string, line: string) {
    if (!userId) return false
    try { await createNotification(userId, 'general', subject, line, '/talent/agency/cases') } catch { }
    try {
      if (!(await emailAllowed(admin, userId, 'application_updates'))) return true
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      const email = authUser?.user?.email
      if (email) await sendAgencyUpdateEmail(email, name, subject, line, '/talent/agency/cases')
    } catch { }
    return true
  }

  let reminded = 0
  for (const booking of due) {
    const candidate: any = candidateById.get(booking.candidate_id)
    const employer: any = employerById.get(booking.employer_id)
    const propertyName = employer?.property_name || employer?.company_name || 'the property'
    const therapistName = candidate?.full_name || 'the professional'
    const shift = booking.shift_date ? new Date(booking.shift_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'your recent shift'
    let sent = false

    if (!booking.candidate_review_completed_at && candidate?.user_id) {
      sent = await nudge(
        candidate.user_id,
        therapistName,
        'Your review releases your payment',
        `Two minutes on how ${propertyName} was to work with on ${shift} releases your payment for that shift. It goes out automatically seven days after the shift either way, but reviewing now is the quickest route to it.`,
      ) || sent
    }

    if (!booking.employer_review_completed_at && employer?.user_id) {
      // No payment pressure here, because their review holds up nothing.
      sent = await nudge(
        employer.user_id,
        propertyName,
        `How was your cover on ${shift}?`,
        `A minute on how ${therapistName} worked out is what the next property reads before booking them. It does not hold up their payment - that is already on its way - but an unreviewed professional is a harder booking for everybody.`,
      ) || sent
    }

    if (sent) {
      reminded += 1
      await admin.from('agency_bookings')
        .update({ review_reminder_last_at: new Date().toISOString() })
        .eq('id', booking.id)
    }
  }

  return NextResponse.json({ checked: bookings?.length || 0, reminded })
}
