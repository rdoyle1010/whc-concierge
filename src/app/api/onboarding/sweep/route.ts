import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isInternalApiRequest } from '@/lib/internal-request'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'
import { onboardingEmailHtml, onboardingSubject } from '@/lib/onboarding-email'
import { accountsBefore, addressFor, recentAccounts, SETUP_HELP_LIMIT } from '@/lib/onboarding-accounts'

// The how-to-use-it email, an hour after somebody signs up.
//
// The welcome email says hello. This one says what the platform is for, in
// the language of the door they came in through, and offers a person if they
// would rather not do it themselves. An hour is deliberate: long enough that
// they have had a look round, short enough that they still remember why they
// signed up.
//
// Runs hourly. Two things stop it sending twice: the email_log row of kind
// 'onboarding', which is written by the sender itself whatever the outcome,
// and the age band below. The log is the real guard - a run that fires twice
// in a minute still sends one email each.

export const dynamic = 'force-dynamic'

// Old enough to have looked round, young enough that the sweep is not
// back-emailing the whole register. The floor is generous so a missed run,
// or a deploy that took the site down for an afternoon, still catches up.
// Forty-five minutes, not sixty. The sweep runs once an hour, so a strict
// hour means somebody who signed up at 10:20 is fifty-five minutes old at the
// 11:15 run, misses it, and hears nothing until 12:15. Three quarters of an
// hour catches them on the first run after they signed up, which is what "an
// hour later" was always meant to be.
const OLDER_THAN_HOURS = 0.75
const YOUNGER_THAN_HOURS = 24 * 14
const BATCH_LIMIT = 60

export async function POST(req: NextRequest) {
  const admin = createAdminClient()

  if (!isInternalApiRequest(req)) {
    const { getRequestUser } = await import('@/lib/request-user')
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (account?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let accounts
  try {
    accounts = await recentAccounts(admin, {
      olderThanHours: OLDER_THAN_HOURS,
      youngerThanHours: YOUNGER_THAN_HOURS,
      limit: BATCH_LIMIT,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not read accounts' }, { status: 500 })
  }

  const due = accounts.filter(account => account.userId && !account.onboardingEmail)
  const results: { name: string; audience: string; status: string; error?: string }[] = []

  for (const account of due) {
    // Every column, on purpose. The two tables spell their address column
    // differently and neither carries all three spellings - candidate
    // profiles carry no `email` at all, because a professional's address
    // lives in auth.users. Naming a column that is not there does not return
    // null, it fails the whole query, and this is one row.
    const table = account.kind === 'candidate' ? 'candidate_profiles' : 'employer_profiles'
    const { data: row } = await admin.from(table).select('*').eq('id', account.id).maybeSingle()

    const to = await addressFor(admin, row, account.userId)
    if (!to) {
      results.push({ name: account.name, audience: account.audience, status: 'no address' })
      continue
    }

    const before = await accountsBefore(admin, account.createdAt)
    const ageHours = (Date.now() - new Date(account.createdAt).getTime()) / 3600_000

    const context = {
      firstName: String(account.name || '').trim().split(/\s+/)[0] || '',
      audience: account.audience,
      strength: { score: account.score, missing: account.missing },
      setupOfferOpen: before < SETUP_HELP_LIMIT,
      justSignedUp: ageHours < 6,
    }

    const sent = await sendTransactionalEmail({
      to,
      subject: onboardingSubject(context),
      html: onboardingEmailHtml(context),
      kind: 'onboarding',
      userId: account.userId,
      replyTo: SUPPORT_MAILBOX,
    })

    results.push({
      name: account.name,
      audience: account.audience,
      status: sent.status,
      error: sent.error,
    })
  }

  return NextResponse.json({
    considered: accounts.length,
    due: due.length,
    sent: results.filter(r => r.status === 'sent').length,
    results,
  })
}
