import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const PRIVACY_POLICY_VERSION = '2026-08-26'
export const MARKETING_CONSENT_WORDING = 'I would like Wellness House Collective to send me marketing emails about jobs, Academy courses, platform features, events and relevant WHC services. I can unsubscribe at any time.'
export const NEWSLETTER_CONSENT_WORDING = 'I would like Wellness House Collective to email me its newsletter, including industry news, jobs, Academy updates, events and relevant WHC services. I can unsubscribe at any time.'

const SITE = 'https://talent.wellnesshousecollective.co.uk'
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

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
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:620px;margin:0 auto;padding:40px 22px;color:#10283b">
      <p style="font-weight:700;margin-bottom:30px">Wellness House Collective</p>
      <h1 style="font-size:26px;line-height:1.2">${heading}</h1>
      <p style="font-size:15px;line-height:1.7;color:#4d4d4d">${intro}</p>
      <p style="font-size:14px;line-height:1.7;color:#4d4d4d"><strong>What you are agreeing to:</strong><br>${wording}</p>
      <p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#0b2f4d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:7px;font-weight:600">Confirm subscription</a></p>
      <p style="font-size:12px;line-height:1.6;color:#7d8990">If you did not request this, ignore this email. Nothing will be activated. This confirmation link expires in 24 hours.</p>
      <p style="font-size:12px;line-height:1.6;color:#7d8990;margin-top:30px">WHC Concierge · talent.wellnesshousecollective.co.uk · <a href="${SITE}/privacy" style="color:#4d4d4d">Privacy policy</a></p>
    </div>
  `
}

export async function sendMarketingDoubleOptInEmail(email: string, token: string) {
  const url = `${SITE}/api/privacy/marketing/confirm?token=${encodeURIComponent(token)}`
  return sendEmail(email, 'Please confirm your WHC marketing preferences', confirmationEmailHtml(
    'One more step to confirm marketing emails',
    'You asked to receive optional WHC marketing emails. We use double opt-in, so nothing is activated until you confirm below.',
    MARKETING_CONSENT_WORDING,
    url,
  ))
}

export async function sendNewsletterDoubleOptInEmail(email: string, token: string) {
  const url = `${SITE}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
  return sendEmail(email, 'Please confirm your WHC newsletter subscription', confirmationEmailHtml(
    'Confirm your WHC newsletter',
    'You entered your email on WHC to receive our newsletter. We use double opt-in, so we will not add you to the newsletter list until you confirm below.',
    NEWSLETTER_CONSENT_WORDING,
    url,
  ))
}

export function marketingUnsubscribeUrl(userId: string) {
  return `${SITE}/api/privacy/marketing/unsubscribe?uid=${encodeURIComponent(userId)}&token=${createUnsubscribeToken(userId)}`
}

export function newsletterUnsubscribeUrl(subscriberId: string) {
  return `${SITE}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}&token=${createNewsletterUnsubscribeToken(subscriberId)}`
}
