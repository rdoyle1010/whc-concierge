import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'

// Confirming an address after somebody is already in, rather than before.
//
// Supabase can hold an account at the door until the address is confirmed. It
// works, and it costs more than it saves: a therapist signs up, lands on a
// "check your email" page, the message sits in promotions, and she never comes
// back. So the door is open, and the address is confirmed from inside instead -
// by a banner that asks rather than blocks.
//
// The address still has to be real, because an unconfirmed one silently
// swallows everything we ever send: the welcome, the guide, job alerts, an
// interview invitation. This is what turns "probably reachable" into "reached".

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(user.id)
  const account = data?.user

  return NextResponse.json({
    email: account?.email || null,
    confirmed: Boolean(account?.email_confirmed_at || (account as any)?.confirmed_at),
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Three an hour. Enough for a mistyped address to be fixed and tried again,
  // not enough to use somebody's own account to post mail at a third party.
  const limited = await enforceRateLimit(req, 'confirm-email', {
    windowMs: 60 * 60 * 1000, maxRequests: 3, key: user.id,
  })
  if (limited) {
    return NextResponse.json({
      error: `That has been sent a few times already. Try again in ${Math.ceil(limited.retryAfterSeconds / 60)} minutes, and check your spam folder in the meantime.`,
    }, { status: 429 })
  }

  const admin = createAdminClient()
  const { data: found } = await admin.auth.admin.getUserById(user.id)
  const account = found?.user
  const address = account?.email
  if (!address) return NextResponse.json({ error: 'There is no address on this account.' }, { status: 400 })
  if (account?.email_confirmed_at) return NextResponse.json({ confirmed: true })

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://talenthousecollective.co.uk'

  // Supabase mints the link; we send it ourselves, so it arrives in the same
  // typeface as everything else rather than as a default template from a
  // service the reader has never heard of. Following it both signs them in
  // and marks the address confirmed.
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: address,
    options: { redirectTo: `${site}/login?confirmed=1` },
  })

  const url = link?.properties?.action_link
  if (error || !url) {
    return NextResponse.json({
      error: error?.message || 'We could not create the confirmation link. Try again shortly.',
    }, { status: 502 })
  }

  const sent = await sendTransactionalEmail({
    to: address,
    subject: 'Confirm your email address',
    html: confirmEmailHtml(url, address),
    kind: 'verification',
    userId: user.id,
    replyTo: SUPPORT_MAILBOX,
  })

  if (!sent.ok) {
    return NextResponse.json({ error: sent.error || 'The email did not send.' }, { status: 502 })
  }

  return NextResponse.json({ success: true, sentTo: address })
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function confirmEmailHtml(url: string, address: string): string {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:24px 30px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
        <p style="margin:0;color:#ffffff;font-size:21px;font-weight:600;">Confirm your email address</p>
      </div>
      <div style="padding:26px 30px;">
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          One click and we know we can reach you. Until then, anything we send - a job alert, an
          interview invitation, a message from a property - could be going nowhere.
        </p>
        <p style="margin:0 0 22px;">
          <a href="${url}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:600;">Confirm ${escape(address)}</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b6b;">
          The link signs you in as well, so you will land back on the platform. If you did not sign up
          with us, ignore this and nothing happens.
        </p>
        <p style="margin:22px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
