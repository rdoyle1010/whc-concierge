import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'
import { onboardingEmailHtml, onboardingSubject } from '@/lib/onboarding-email'
import { accountsBefore, addressFor, recentAccounts, SETUP_HELP_LIMIT } from '@/lib/onboarding-accounts'

// Who has signed up, how far they actually got, and whether anybody has
// spoken to them.
//
// Approving accounts is not the same as knowing they are stuck. A person on
// 20% who has not been back is worth an email today, not a report in a month,
// and at launch volume that email can come from a human being. This screen is
// what makes that possible: the list, the gap, and a button.

const WINDOW_DAYS = 60

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || WINDOW_DAYS))

  try {
    const accounts = await recentAccounts(admin, {
      youngerThanHours: days * 24,
      limit: 200,
      withEmail: true,
    })

    const [candidateCount, employerCount] = await Promise.all([
      admin.from('candidate_profiles').select('id', { count: 'exact', head: true }),
      admin.from('employer_profiles').select('id', { count: 'exact', head: true }),
    ])
    const total = (candidateCount.count || 0) + (employerCount.count || 0)

    return NextResponse.json({
      accounts,
      setupHelp: { limit: SETUP_HELP_LIMIT, taken: total, remaining: Math.max(0, SETUP_HELP_LIMIT - total) },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not read accounts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const kind = body.kind === 'employer' ? 'employer' : 'candidate'
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Missing account' }, { status: 400 })

  const admin = createAdminClient()
  const table = kind === 'employer' ? 'employer_profiles' : 'candidate_profiles'
  // Every column, on purpose: the address lives under a different name on
  // each table and under none of them on candidate_profiles, and naming a
  // column that is not there fails the whole query rather than returning null.
  const { data: row, error: rowError } = await admin.from(table).select('*').eq('id', id).maybeSingle()
  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const account: any = row
  const name = account.full_name || account.property_name || account.contact_name || ''
  const firstName = String(name).trim().split(/\s+/)[0] || ''
  const to = await addressFor(admin, account, account.user_id || null)
  if (!to) return NextResponse.json({ error: 'No email address on this account' }, { status: 400 })

  // Send the standard guide by hand: for somebody who signed up before this
  // existed, or whose first attempt failed.
  if (action === 'send_guide') {
    const audience = String(body.audience || (kind === 'employer' ? 'employer' : 'talent')) as any
    const before = await accountsBefore(admin, account.created_at)
    const context = {
      firstName,
      audience,
      strength: Array.isArray(body.missing) && typeof body.score === 'number'
        ? { score: body.score, missing: body.missing.map(String) }
        : null,
      setupOfferOpen: before < SETUP_HELP_LIMIT,
      justSignedUp: false,
    }
    const sent = await sendTransactionalEmail({
      to,
      subject: onboardingSubject(context),
      html: onboardingEmailHtml(context),
      kind: 'onboarding',
      userId: account.user_id || null,
      replyTo: SUPPORT_MAILBOX,
    })
    if (!sent.ok) return NextResponse.json({ error: sent.error || 'The email did not send.' }, { status: 502 })
    return NextResponse.json({ success: true, status: sent.status })
  }

  // A personal offer of help, in Rebecca's words rather than a template's.
  if (action === 'offer_help') {
    const message = String(body.message || '').trim().slice(0, 2000)
    if (!message) return NextResponse.json({ error: 'Write something to send' }, { status: 400 })
    const html = personalNote(firstName, message)
    const sent = await sendTransactionalEmail({
      to,
      subject: String(body.subject || '').trim().slice(0, 160) || 'A hand with your Talent House profile',
      html,
      kind: 'onboarding',
      userId: account.user_id || null,
      replyTo: SUPPORT_MAILBOX,
    })
    if (!sent.ok) return NextResponse.json({ error: sent.error || 'The email did not send.' }, { status: 502 })
    if (account.user_id) {
      await createNotification(account.user_id, 'general', 'A message from Talent House',
        'We have emailed you about finishing your profile. Reply to that email if you would like a hand.',
        kind === 'employer' ? '/employer/profile' : '/talent/profile').catch(() => {})
    }
    return NextResponse.json({ success: true, status: sent.status })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function personalNote(firstName: string, message: string): string {
  const paragraphs = message.split(/\n{2,}/).map(part =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">${escape(part).replace(/\n/g, '<br/>')}</p>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:24px 30px;">
        <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
      </div>
      <div style="padding:26px 30px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">${firstName ? `Hello ${escape(firstName)},` : 'Hello,'}</p>
        ${paragraphs}
        <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#3a3a3a;">Just reply to this email and it comes straight to us.</p>
        <p style="margin:22px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
