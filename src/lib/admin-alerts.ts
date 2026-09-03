import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseUkMobile, smsConfigured, rawSms } from '@/lib/sms'
import { sendTransactionalEmail } from '@/lib/send-email'

// "Somebody just signed up" - straight to Rebecca's phone.
//
// Two deliberate departures from how the platform sends SMS everywhere else.
//
// First, member texts are rewritten by privateNotificationBody so a name or a
// rate never lands on a lock screen. That protection is right for members and
// useless here: an alert saying "you have a new update" tells the person who
// runs the platform nothing. This one names the role and a first name, which
// is enough to act on and still not a full identity on a screen.
//
// Second, it falls back to email when Twilio is not configured. A silent
// failure is how a sign-up went unnoticed before, and an alert that quietly
// does nothing is worse than no alert at all - it is trusted.

const ADMIN_MOBILE_KEY = 'admin_alert_mobile'
const ADMIN_EMAIL_KEY = 'admin_alert_email'

async function config(key: string): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('platform_config').select('value').eq('key', key).limit(1)
    const raw = data?.[0]?.value
    if (typeof raw !== 'string') return ''
    const trimmed = raw.trim()
    // A value typed into the SQL editor arrives as the JSON string "07..."
    // while one saved from the admin form arrives bare. Accept either.
    if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try { return String(JSON.parse(trimmed)).trim() } catch { return trimmed.slice(1, -1).trim() }
    }
    return trimmed
  } catch { return '' }
}

/** "Hannah Lucy Francis" -> "Hannah F." Enough to recognise, not a full identity. */
function shortName(fullName: string | null | undefined): string {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Someone'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

export type SignupKind = 'talent' | 'employer'

/**
 * Tell the administrator that somebody has joined.
 *
 * Never throws and never blocks registration: a person who has just created an
 * account must not see an error because a text message did not send.
 */
export async function alertAdminOfSignup(kind: SignupKind, name: string | null | undefined): Promise<void> {
  try {
    // A property is named, not shortened: "The Grand Harrogate" is the thing
    // being announced, and "The H." would be nonsense. A person gets an
    // initial instead of a surname.
    const who = kind === 'employer'
      ? (String(name || '').trim().slice(0, 80) || 'A property')
      : shortName(name)
    const what = kind === 'employer' ? 'property' : 'talent'
    const body = `Talent House Collective: new ${what} sign-up - ${who}. talenthousecollective.co.uk/admin/users`

    const mobile = normaliseUkMobile(await config(ADMIN_MOBILE_KEY))
    if (mobile && smsConfigured()) {
      const sent = await rawSms(mobile, body)
      if (sent) return
    }

    // No number, no Twilio, or the text bounced. Email rather than silence.
    const email = await config(ADMIN_EMAIL_KEY)
    if (email) {
      await sendTransactionalEmail({
        to: email,
        subject: `New ${what} sign-up - ${who}`,
        html: `<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7">`
          + `${who} has just created a ${what} account.</p>`
          + `<p style="font-family:Inter,Arial,sans-serif;font-size:15px">`
          + `<a href="https://talenthousecollective.co.uk/admin/users">Open the user list</a></p>`,
        kind: 'notification',
      })
    }
  } catch {
    // Registration succeeded. Nothing here is worth failing it for.
  }
}
