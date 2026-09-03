import { createAdminClient } from '@/lib/supabase/admin'

// One place every transactional email goes through, so that "did they get it?"
// has an answer.
//
// Sends used to fail into console.error inside a serverless function - unread,
// and gone within days. A rejected send, a missing address and a spam folder
// all looked identical from the outside, which made every question about a
// missing email a guess.

// Resend verifies domains, not brand names. mail.talenthousecollective.co.uk is
// not verified yet, so this stays on the verified subdomain: sending from an
// unverified domain is rejected, and the rejection is exactly the kind of
// silent failure this file exists to stop.
export const TRANSACTIONAL_FROM = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

export type EmailKind =
  | 'welcome_talent' | 'welcome_employer' | 'newsletter_welcome'
  | 'verification' | 'certificate' | 'notification' | 'other'

type SendResult = { ok: boolean; status: 'sent' | 'failed' | 'skipped'; error?: string }

async function record(entry: {
  recipient: string; kind: EmailKind; subject: string; userId?: string | null
  status: 'sent' | 'failed' | 'skipped'; error?: string | null; providerId?: string | null
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
    })
  } catch {
    // The log must never be the reason an email fails to send. If the table is
    // not there yet, the send still happens.
  }
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
