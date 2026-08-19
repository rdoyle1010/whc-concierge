// SMS sending via Twilio's REST API (plain fetch - no SDK dependency).
//
// Production-preferred Netlify environment variables:
//   TWILIO_ACCOUNT_SID
//   TWILIO_API_KEY_SID
//   TWILIO_API_KEY_SECRET
//   TWILIO_FROM_NUMBER
//
// TWILIO_AUTH_TOKEN is supported only as a fallback for initial testing.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER

export function smsConfigured(): boolean {
  const hasProductionKey = Boolean(TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET)
  const hasFallbackToken = Boolean(TWILIO_AUTH_TOKEN)
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_FROM_NUMBER && (hasProductionKey || hasFallbackToken))
}

export function normaliseUkMobile(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  return null
}

export async function sendSms(to: string | null | undefined, body: string): Promise<boolean> {
  const number = normaliseUkMobile(to)
  if (!number) {
    console.log(`[SMS skipped - no valid mobile] body: ${body.slice(0, 60)}`)
    return false
  }
  if (!smsConfigured()) {
    console.log(`[SMS skipped - Twilio not configured] To: ${number}, body: ${body.slice(0, 60)}`)
    return false
  }

  try {
    const username = TWILIO_API_KEY_SID || TWILIO_ACCOUNT_SID!
    const password = TWILIO_API_KEY_SECRET || TWILIO_AUTH_TOKEN!
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: number, From: TWILIO_FROM_NUMBER!, Body: body.slice(0, 600) }).toString(),
      }
    )
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[SMS FAILED ${res.status}] To: ${number} - ${detail.slice(0, 300)}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[SMS FAILED] network error:', err)
    return false
  }
}

export async function sendSmsIfOptedIn(opts: {
  to: string | null | undefined
  body: string
  optedIn: boolean | null | undefined
}): Promise<boolean> {
  if (!opts.optedIn) {
    console.log('[SMS skipped - recipient has not opted in]')
    return false
  }
  return sendSms(opts.to, opts.body)
}
