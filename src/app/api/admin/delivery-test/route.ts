import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail, TRANSACTIONAL_FROM } from '@/lib/send-email'
import { normaliseUkMobile, smsConfigured, rawSms } from '@/lib/sms'

// Prove delivery works, rather than registering a fake account to find out.
//
// "I signed up and never got an email" had no answer that did not involve
// guessing: a missing API key, an unverified sending domain, a provider
// rejection and a spam folder all look identical from the outside. This sends
// a real message down the real path and reports exactly what came back -
// including the provider's own words when it refuses.

async function config(key: string): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('platform_config').select('value').eq('key', key).limit(1)
    const raw = data?.[0]?.value
    if (typeof raw !== 'string') return ''
    const trimmed = raw.trim()
    if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try { return String(JSON.parse(trimmed)).trim() } catch { return trimmed.slice(1, -1).trim() }
    }
    return trimmed
  } catch { return '' }
}

/** j.bloggs@example.com -> j***s@example.com. Enough to recognise, not a leak. */
function maskEmail(address: string): string {
  const [local, domain] = address.split('@')
  if (!domain) return address
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

export async function GET() {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const [mobile, email] = await Promise.all([config('admin_alert_mobile'), config('admin_alert_email')])
  // The destination shown has to be the one a message would really go to.
  // Reporting only the configured value read "Nothing saved to send to" on a
  // panel whose button then delivered perfectly well, which teaches you to
  // ignore the panel - and the next time it says something is missing, it will
  // be right and you will not believe it.
  const emailTo = email || user.email || ''
  return NextResponse.json({
    email: {
      // A key on the deployment, not the key itself - this is a browser response.
      providerConfigured: Boolean(process.env.RESEND_API_KEY),
      from: TRANSACTIONAL_FROM,
      to: emailTo ? maskEmail(emailTo) : null,
      // Said plainly, because a fallback that is silently your own address is
      // one you stop thinking about until somebody else needs the alerts.
      usingAccountFallback: !email && Boolean(user.email),
    },
    sms: {
      providerConfigured: smsConfigured(),
      to: normaliseUkMobile(mobile),
      // A number typed with a stray character reads as "no number set", which
      // is indistinguishable from having left it blank. Say which it is.
      rejected: Boolean(mobile) && !normaliseUkMobile(mobile),
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { channel } = await req.json().catch(() => ({ channel: '' }))
  const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })

  if (channel === 'sms') {
    const raw = await config('admin_alert_mobile')
    const number = normaliseUkMobile(raw)
    if (!number) {
      return NextResponse.json({
        status: 'skipped',
        detail: raw
          ? `"${raw}" is not a UK mobile we can send to. Use the 07... form, eleven digits.`
          : 'No mobile number saved. Add one above and save it first.',
      })
    }
    if (!smsConfigured()) {
      return NextResponse.json({
        status: 'skipped',
        detail: 'Twilio is not configured on this deployment. Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET and TWILIO_FROM_NUMBER in Netlify, then redeploy.',
      })
    }
    const sent = await rawSms(number, `Talent House Collective: test message sent from your admin settings at ${stamp}. Texts are working.`)
    return NextResponse.json(sent
      ? { status: 'sent', detail: `Sent to ${number}. It should arrive within a few seconds.` }
      : { status: 'failed', detail: 'Twilio refused the message. Open Messages We Sent for the reason it gave.' })
  }

  const address = (await config('admin_alert_email')) || user.email || ''
  if (!address) {
    return NextResponse.json({
      status: 'skipped',
      detail: 'No fallback email saved and no address on your admin account. Add one above and save it first.',
    })
  }
  const result = await sendTransactionalEmail({
    to: address,
    subject: 'Talent House Collective - delivery test',
    html: `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7">`
      + `This is a test sent from your admin settings at ${stamp}.</p>`
      + `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7">`
      + `If you are reading it, email from the platform reaches you. Check your junk folder if it took a detour.</p>`,
    kind: 'admin_alert',
  })
  return NextResponse.json({
    status: result.status,
    detail: result.status === 'sent'
      ? `Sent to ${maskEmail(address)} from ${TRANSACTIONAL_FROM}. Check your junk folder if it does not appear.`
      : result.error || 'The email provider rejected it.',
  })
}
