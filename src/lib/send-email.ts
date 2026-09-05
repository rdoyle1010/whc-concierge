import { createAdminClient } from '@/lib/supabase/admin'

// One place every transactional email goes through, so that "did they get it?"
// has an answer.
//
// Sends used to fail into console.error inside a serverless function - unread,
// and gone within days. A rejected send, a missing address and a spam folder
// all looked identical from the outside, which made every question about a
// missing email a guess.

// Where everything the platform sends comes from.
//
// This was written out by hand in seventeen files. Changing the brand meant
// editing all seventeen, and the one somebody missed would keep sending from
// the old domain for months without anybody noticing, because a wrong From
// address does not fail - it arrives, looking like a different company.
//
// Resend verifies domains, not brand names, so an unverified domain is
// rejected outright. The environment variable is the way back: if this
// address ever stops being verified, set EMAIL_FROM in Netlify to a domain
// that is and every email recovers on the next request, with no deploy and
// nobody waiting on a developer.
export const TRANSACTIONAL_FROM = process.env.EMAIL_FROM
  || 'Talent House Collective <noreply@mail.talenthousecollective.co.uk>'

export type EmailKind =
  | 'welcome_talent' | 'welcome_employer' | 'newsletter_welcome'
  | 'verification' | 'certificate' | 'notification' | 'other'
  | 'admin_alert' | 'interview' | 'offer' | 'decision' | 'job_alert' | 'application'

type SendResult = { ok: boolean; status: 'sent' | 'failed' | 'skipped'; error?: string }

async function record(entry: {
  recipient: string; kind: EmailKind; subject: string; userId?: string | null
  status: 'sent' | 'failed' | 'skipped'; error?: string | null; providerId?: string | null
  channel?: 'email' | 'sms'
}) {
  try {
    const admin = createAdminClient()
    await admin.from('email_log').insert({
      recipient: entry.recipient,
      kind: entry.kind,
      subject: entry.subject.slice(0, 300),
      user_id: entry.userId || null,
      status: entry.status,
      error: entry.error ? String(entry.error).slice(0, 500) : null,
      provider_id: entry.providerId || null,
      channel: entry.channel || 'email',
    })
  } catch {
    // The log must never be the reason an email fails to send. If the table is
    // not there yet, the send still happens.
  }
}

/**
 * Record a text message alongside the emails.
 *
 * Same table on purpose: "what have we sent this person" is one question, and
 * two logs for two channels means checking two places to answer it.
 */
export async function recordSms(entry: {
  to: string; body: string; status: 'sent' | 'failed' | 'skipped'; error?: string | null
}): Promise<void> {
  await record({
    recipient: entry.to || '(no number)',
    kind: 'notification',
    // The text itself, trimmed - short enough to recognise, and these are
    // deliberately contentless notifications rather than private detail.
    subject: entry.body.slice(0, 160),
    status: entry.status,
    error: entry.error,
    channel: 'sms',
  })
}

export async function sendTransactionalEmail(opts: {
  to: string
  subject: string
  html: string
  kind: EmailKind
  userId?: string | null
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const to = String(opts.to || '').trim()

  if (!to) {
    await record({ recipient: '(none)', kind: opts.kind, subject: opts.subject, userId: opts.userId, status: 'skipped', error: 'No address on the account' })
    return { ok: false, status: 'skipped', error: 'No address on the account' }
  }
  if (!apiKey) {
    await record({ recipient: to, kind: opts.kind, subject: opts.subject, userId: opts.userId, status: 'skipped', error: 'RESEND_API_KEY is not set on this deployment' })
    return { ok: false, status: 'skipped', error: 'RESEND_API_KEY is not set' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: TRANSACTIONAL_FROM, to, subject: opts.subject, html: opts.html }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      // The provider's own words, kept verbatim: "domain is not verified" and
      // "you can only send to your own address in test mode" are different
      // problems with different fixes, and paraphrasing loses that.
      const error = body?.message || body?.error || `Resend returned ${res.status}`
      await record({ recipient: to, kind: opts.kind, subject: opts.subject, userId: opts.userId, status: 'failed', error })
      return { ok: false, status: 'failed', error }
    }
    await record({ recipient: to, kind: opts.kind, subject: opts.subject, userId: opts.userId, status: 'sent', providerId: body?.id || null })
    return { ok: true, status: 'sent' }
  } catch (err: any) {
    const error = err?.message || 'Could not reach the email provider'
    await record({ recipient: to, kind: opts.kind, subject: opts.subject, userId: opts.userId, status: 'failed', error })
    return { ok: false, status: 'failed', error }
  }
}
