import { TRANSACTIONAL_FROM } from '@/lib/send-email'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const PRIVACY_POLICY_VERSION = '2026-08-26'
export const MARKETING_CONSENT_WORDING = 'I would like Wellness House Collective to send me marketing emails about jobs, Academy courses, platform features, events and relevant Talent House services. I can unsubscribe at any time.'
export const NEWSLETTER_CONSENT_WORDING = 'I would like Wellness House Collective to email me its newsletter, including industry news, jobs, Academy updates, events and relevant Talent House services. I can unsubscribe at any time.'

const SITE = 'https://talenthousecollective.co.uk'
const FROM_EMAIL = TRANSACTIONAL_FROM

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function newConfirmationToken() {
  return randomBytes(32).toString('hex')
}

function unsubscribeSecret() {
  return process.env.WHC_PRIVACY_SIGNING_SECRET || process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function createSignedToken(scope: string, id: string) {
  const secret = unsubscribeSecret()
  if (!secret) throw new Error('Privacy signing secret is not configured')
  return createHmac('sha256', secret).update(`${scope}:${id}`).digest('hex')
}

function verifySignedToken(scope: string, id: string, token: string) {
  try {
    const expected = Buffer.from(createSignedToken(scope, id), 'hex')
    const provided = Buffer.from(String(token || ''), 'hex')
    return expected.length === provided.length && timingSafeEqual(expected, provided)
  } catch { return false }
}

export function createUnsubscribeToken(userId: string) {
  return createSignedToken('marketing-unsubscribe', userId)
}

export function verifyUnsubscribeToken(userId: string, token: string) {
  return verifySignedToken('marketing-unsubscribe', userId, token)
}

export function createNewsletterUnsubscribeToken(subscriberId: string) {
  return createSignedToken('newsletter-unsubscribe', subscriberId)
}

export function verifyNewsletterUnsubscribeToken(subscriberId: string, token: string) {
  return verifySignedToken('newsletter-unsubscribe', subscriberId, token)
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[Privacy email skipped - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`)
    return false
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!response.ok) {
    console.error(`[Privacy email failed ${response.status}] ${await response.text().catch(() => '')}`)
    return false
  }
  return true
}

function confirmationEmailHtml(heading: string, intro: string, wording: string, url: string) {
  return `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:620px;margin:0 auto;padding:40px 22px;color:#1c1c1c">
      <p style="font-weight:700;margin-bottom:30px">Wellness House Collective</p>
      <h1 style="font-size:26px;line-height:1.2">${heading}</h1>
      <p style="font-size:15px;line-height:1.7;color:#4d4d4d">${intro}</p>
      <p style="font-size:14px;line-height:1.7;color:#4d4d4d"><strong>What you are agreeing to:</strong><br>${wording}</p>
      <p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;padding:13px 20px;border-radius:7px;font-weight:600">Confirm subscription</a></p>
      <p style="font-size:12px;line-height:1.6;color:#8c8c8c">If you did not request this, ignore this email. Nothing will be activated. This confirmation link expires in 24 hours.</p>
      <p style="font-size:12px;line-height:1.6;color:#8c8c8c;margin-top:30px">Talent House Collective · talenthousecollective.co.uk · <a href="${SITE}/privacy" style="color:#4d4d4d">Privacy policy</a></p>
    </div>
  `
}

export async function sendMarketingDoubleOptInEmail(email: string, token: string) {
  const url = `${SITE}/api/privacy/marketing/confirm?token=${encodeURIComponent(token)}`
  return sendEmail(email, 'Please confirm your Talent House marketing preferences', confirmationEmailHtml(
    'One more step to confirm marketing emails',
    'You asked to receive optional Talent House marketing emails. We use double opt-in, so nothing is activated until you confirm below.',
    MARKETING_CONSENT_WORDING,
    url,
  ))
}

export async function sendNewsletterDoubleOptInEmail(email: string, token: string) {
  const url = `${SITE}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
  return sendEmail(email, 'Please confirm your Talent House newsletter subscription', confirmationEmailHtml(
    'Confirm your Talent House newsletter',
    'You entered your email on Talent House to receive our newsletter. We use double opt-in, so we will not add you to the newsletter list until you confirm below.',
    NEWSLETTER_CONSENT_WORDING,
    url,
  ))
}

// Start the double opt-in for somebody, from wherever they asked.
//
// This lived only inside /api/privacy/marketing/request, which needs a signed
// in session - so the only place on the whole platform where anybody could
// opt in was the Privacy & Preferences page, buried in account settings.
// Six of the first eight members had never opted in, and none of them had
// declined: nobody had asked them.
//
// Registration can now ask, which is the moment somebody is most willing and
// the only moment you get for free. The record still says exactly what they
// saw, and it is still pending until they click the link.
export async function startMarketingOptIn(
  admin: any,
  userId: string,
  email: string,
  source: 'registration' | 'account_preferences',
): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !email) return { ok: false, error: 'No account to opt in' }

  const token = newConfirmationToken()
  const now = new Date()
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await admin.from('marketing_confirmation_tokens').delete().eq('user_id', userId).is('consumed_at', null)
  const { error: tokenError } = await admin.from('marketing_confirmation_tokens').insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expires.toISOString(),
  })
  if (tokenError) return { ok: false, error: tokenError.message }

  const { error: prefError } = await admin.from('privacy_preferences').upsert({
    user_id: userId,
    marketing_email_status: 'pending',
    marketing_email_requested_at: now.toISOString(),
    marketing_email_confirmed_at: null,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' })
  if (prefError) return { ok: false, error: prefError.message }

  // The wording recorded is the wording they were shown. That is the whole
  // point of keeping a consent record rather than a boolean.
  await admin.from('consent_events').insert({
    user_id: userId,
    consent_type: 'marketing_email',
    action: 'requested',
    policy_version: PRIVACY_POLICY_VERSION,
    wording: MARKETING_CONSENT_WORDING,
    source,
  })

  const sent = await sendMarketingDoubleOptInEmail(email, token)
  return sent ? { ok: true } : { ok: false, error: 'The confirmation email could not be sent' }
}

export function marketingUnsubscribeUrl(userId: string) {
  return `${SITE}/api/privacy/marketing/unsubscribe?uid=${encodeURIComponent(userId)}&token=${createUnsubscribeToken(userId)}`
}

export function newsletterUnsubscribeUrl(subscriberId: string) {
  return `${SITE}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}&token=${createNewsletterUnsubscribeToken(subscriberId)}`
}
