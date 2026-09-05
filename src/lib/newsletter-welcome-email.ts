import { TRANSACTIONAL_FROM } from '@/lib/send-email'
import { escapeHtml, safeHttpUrl } from '@/lib/newsletter-blocks'

// The email a newsletter subscriber gets when they confirm.
//
// Until now they got nothing at all, which is the worst version: somebody
// asks to hear from you, confirms, and then silence until whenever the next
// issue happens to go out.
//
// It is deliberately not the member welcome. A subscriber has given an email
// address and nothing else - they have no profile to complete, no account to
// go to and no matches waiting. Telling them to "complete your profile" sends
// them to a sign-in wall and teaches them the email was written for somebody
// else. So this one does the two jobs it can honestly do: say what will
// arrive and how often, and give one real reason to come back.

const SITE = 'https://talenthousecollective.co.uk'

// Resend verifies domains, not brand names. mail.talenthousecollective.co.uk is
// not verified yet, so sending from it would bounce silently - this stays on
// the old verified subdomain until that changes, and every send uses this one
// constant so it changes in one place.
export const NEWSLETTER_FROM = TRANSACTIONAL_FROM

export function newsletterWelcomeSubject(): string {
  return 'You are on the list - Talent House Collective'
}

export function newsletterWelcomeHtml({ unsubscribeUrl }: { unsubscribeUrl?: string } = {}): string {
  const unsubscribe = safeHttpUrl(unsubscribeUrl)
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f6f8;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#1c1c1c">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Roles, industry insight and what is actually happening in luxury spa - roughly twice a month.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f8;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e5e5;border-radius:20px;overflow:hidden">

        <tr><td style="background:#1c1c1c;padding:30px;color:#fff">
          <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#b9c8d3">Talent House Collective</div>
          <div style="font-size:26px;line-height:1.15;font-weight:650;margin-top:10px">You are on the list</div>
        </td></tr>

        <tr><td style="padding:36px 34px">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#465761">
            Thank you for confirming. You will hear from us roughly twice a month, and only when there is something
            worth reading.
          </p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.75;color:#465761">What arrives:</p>
          <ul style="margin:0 0 22px;padding-left:20px;font-size:15px;line-height:1.85;color:#465761">
            <li>Roles at properties that rarely advertise publicly</li>
            <li>What spa and wellness salaries are actually doing, with numbers</li>
            <li>Industry insight written by people who have run spas, not summarised from elsewhere</li>
          </ul>
          <p style="margin:0 0 26px;font-size:15px;line-height:1.75;color:#465761">
            No account is needed for any of that. If you decide you want one, a profile puts you in front of properties
            searching directly - but the newsletter stands on its own.
          </p>

          <div style="margin:0 0 8px">
            <a href="${SITE}/jobs" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-size:13px;font-weight:650">See what is live now</a>
          </div>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#73818a">
            Curious about the platform itself? <a href="${SITE}/register/talent" style="color:#1c1c1c">Create a profile</a>
            if you are a professional, or <a href="${SITE}/register/employer" style="color:#1c1c1c">list a property</a> if you hire.
          </p>
        </td></tr>

        <tr><td style="background:#f7f7f7;border-top:1px solid #e5e5e5;padding:24px 30px;font-size:11px;line-height:1.65;color:#73818a">
          <div style="font-weight:600;color:#4d4d4d;margin-bottom:7px">Talent House Collective</div>
          <div>Better matches. Better careers. Better teams.</div>
          <div style="margin-top:10px">talenthousecollective.co.uk</div>
          ${unsubscribe
            ? `<div style="margin-top:10px">You confirmed this subscription, so we know you asked for it. <a href="${escapeHtml(unsubscribe)}" style="color:#4d4d4d">Unsubscribe</a> &middot; <a href="${SITE}/privacy" style="color:#4d4d4d">Privacy policy</a></div>`
            : ''}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
