// SMS sending via Twilio's REST API (plain fetch - no SDK dependency).
//
// Requires three environment variables in Netlify:
//   TWILIO_ACCOUNT_SID   - starts "AC..."
//   TWILIO_AUTH_TOKEN    - secret; paste directly into Netlify, never commit
//   TWILIO_FROM_NUMBER   - E.164 format, e.g. +447700900123
//
// Without them, sendSms is a safe no-op that logs and returns false, so the
// rest of the platform (offers, emails, bell notifications) works unchanged.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER

export function smsConfigured(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER)
}

// Normalise a UK-entered mobile number to E.164.
// "07700 900123" → "+447700900123"; already-international numbers pass through.
export function normaliseUkMobile(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  return null // not a recognisable mobile - skip rather than send to a wrong number
}

// Send a text. Returns true on acceptance by Twilio, false otherwise.
// Never throws - SMS is best-effort and must not break the calling flow.
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
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: number, From: TWILIO_FROM_NUMBER!, Body: body }).toString(),
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
