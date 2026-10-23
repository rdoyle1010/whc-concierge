import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { contactFormSchema, validateRequest } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/send-email'
import { administratorEmails } from '@/lib/administrators'

const escape = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Where a contact form lands. The admin-configured contact_email wins; with
// nothing set it goes to every administrator.
//
// It used to fall back to one person's personal address, written into the
// source. That address was the whole disaster recovery plan: change it and you
// ship a deploy, add a second partner and she never sees a single enquiry.
async function getNotificationRecipients(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('platform_config').select('value').eq('key', 'contact_email').maybeSingle()
    const configured = String(data?.value || '').trim()
    if (configured && configured.includes('@')) return [configured]
  } catch { /* fall through to the administrator list */ }
  return await administratorEmails()
}

// Every contact form posts here: the public contact page, Academy for Teams, and
// the account deletion request in settings. The enquiry is saved with the
// service role, not from the browser, so it lands whatever the table's policies
// are, and the limit is the shared one (an in-memory count reset on every cold
// start, which a script could simply wait out).
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'contact-notify', { windowMs: 15 * 60 * 1000, maxRequests: 5 })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many messages from this connection. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    // The honeypot: a person never sees the field, so anything in it is a bot,
    // answered with a success it learns nothing from.
    if (String(body?.company ?? '').trim()) return NextResponse.json({ success: true })
    const validation = validateRequest(contactFormSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    }
    const { name, email, subject, message, type } = validation.data!
    const kind = body?.kind === 'academy_teams' ? 'academy_teams' : (type || 'general')

    let saved = false
    try {
      const { error: insertError } = await createAdminClient().from('contact_queries').insert({
        name, email, subject: subject || null, type: kind, message, status: 'open',
      })
      saved = !insertError
      if (insertError) console.error('Contact query not saved:', insertError.message)
    } catch (error) { console.error('Contact query not saved:', error) }

    const emailSubject = `New Talent House Contact: ${kind} - ${subject}`.replace(/[\r\n]+/g, ' ')

    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">Talent House Collective</p>
        <p style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">New Contact Form Submission</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #6e6a60; font-size: 13px; width: 100px;">Name</td><td style="padding: 8px 0; font-size: 14px; color: #222321; font-weight: 500;">${escape(name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6e6a60; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${escape(email)}" style="color: #57544c;">${escape(email)}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #6e6a60; font-size: 13px;">Type</td><td style="padding: 8px 0; font-size: 14px; color: #222321; text-transform: capitalize;">${escape(kind)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6e6a60; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px; color: #222321; font-weight: 500;">${escape(subject)}</td></tr>
        </table>
        <div style="background: #ede8df; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #6e6a60; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
          <p style="font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${escape(message)}</p>
        </div>
        <p style="font-size: 12px; color: #6e6a60;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    `

    const recipients = await getNotificationRecipients()

    // One send each rather than one send to many, so a single bad address
    // cannot take the enquiry away from everybody else on the list.
    let sent = 0
    for (const recipient of recipients) {
      try { await sendTransactionalEmail({ to: recipient, subject: emailSubject, html, kind: 'contact' }); sent++ }
      catch (error) { console.error('Contact email not sent:', error) }
    }
    // Saved or emailed is enough: either way somebody will see it.
    if (!saved && !sent) return NextResponse.json({ error: 'Your message could not be sent. Please email us instead.' }, { status: 502 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact notify failed:', error)
    return NextResponse.json({ error: 'Your message could not be sent. Please try again.' }, { status: 500 })
  }
}
