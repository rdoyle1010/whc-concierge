import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const PRIVACY_POLICY_VERSION = '2026-08-26'
export const MARKETING_CONSENT_WORDING = 'I would like Wellness House Collective to send me marketing emails about jobs, Academy courses, platform features, events and relevant WHC services. I can unsubscribe at any time.'

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

export function createUnsubscribeToken(userId: string) {
  const secret = unsubscribeSecret()
  if (!secret) throw new Error('Privacy signing secret is not configured')
  return createHmac('sha256', secret).update(`marketing-unsubscribe:${userId}`).digest('hex')
}

export function verifyUnsubscribeToken(userId: string, token: string) {
  try {
    const expected = Buffer.from(createUnsubscribeToken(userId), 'hex')
    const provided = Buffer.from(String(token || ''), 'hex')
    return expected.length === provided.length && timingSafeEqual(expected, provided)
  } catch { return false }
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

export async function sendMarketingDoubleOptInEmail(email: string, token: string) {
  const url = `${SITE}/api/privacy/marketing/confirm?token=${encodeURIComponent(token)}`
  return sendEmail(email, 'Please confirm your WHC marketing preferences', `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:620px;margin:0 auto;padding:40px 22px;color:#10283b">
      <p style="font-weight:700;margin-bottom:30px">Wellness House Collective</p>
      <h1 style="font-size:26px;line-height:1.2">One more step to confirm marketing emails</h1>
      <p style="font-size:15px;line-height:1.7;color:#53636f">You asked to receive optional WHC marketing emails. We use double opt-in, so nothing is activated until you confirm below.</p>
      <p style="font-size:14px;line-height:1.7;color:#53636f"><strong>What you are agreeing to:</strong><br>${MARKETING_CONSENT_WORDING}</p>
      <p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#0b2f4d;color:#fff;text-decoration:none;padding:13px 20px;border-radius:7px;font-weight:600">Confirm marketing emails</a></p>
      <p style="font-size:12px;line-height:1.6;color:#7d8990">If you did not request this, ignore this email. Your marketing preference will remain off. This confirmation link expires in 24 hours.</p>
      <p style="font-size:12px;line-height:1.6;color:#7d8990;margin-top:30px">WHC Concierge · talent.wellnesshousecollective.co.uk · <a href="${SITE}/privacy" style="color:#53636f">Privacy policy</a></p>
    </div>
  `)
}

export function marketingUnsubscribeUrl(userId: string) {
  return `${SITE}/api/privacy/marketing/unsubscribe?uid=${encodeURIComponent(userId)}&token=${createUnsubscribeToken(userId)}`
}
