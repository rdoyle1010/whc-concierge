import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/send-email'
import { consentedRecipients } from '@/lib/consented-recipients'
import { eventDateLabel, eventKindLabel, eventSlug, eventWhereLabel, isEventKind } from '@/lib/events'

// What is on, and telling the register about it.
//
// Announcing is deliberately a separate button from publishing. Publishing
// puts an event on the site, which is reversible and costs nothing if the
// details change an hour later. Announcing puts it in several hundred inboxes,
// which is not reversible at all, so it is pressed on purpose and only once:
// announced_at is written on the way out and refuses a second send.

const SITE = 'https://talenthousecollective.co.uk'
const MAX_PER_SEND = 2000

export async function GET() {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('events').select('*').order('starts_at', { ascending: true }).limit(300)
  // The table arrives with a migration. Say so rather than showing an empty
  // list that reads as "no events".
  if (error) return NextResponse.json({ rows: [], unavailable: true, reason: error.message })
  return NextResponse.json({ rows: data || [] })
}

export async function POST(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'save')
  const admin = createAdminClient()

  if (action === 'save') {
    const title = String(body.title || '').trim().slice(0, 200)
    const startsAt = String(body.starts_at || '').trim()
    if (!title) return NextResponse.json({ error: 'Give the event a title.' }, { status: 400 })
    if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
      return NextResponse.json({ error: 'Give the event a start date.' }, { status: 400 })
    }
    const endsAt = String(body.ends_at || '').trim() || null
    if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      return NextResponse.json({ error: 'The end date cannot be before the start date.' }, { status: 400 })
    }

    const row = {
      title,
      slug: String(body.slug || '').trim() || eventSlug(title, startsAt),
      summary: String(body.summary || '').trim().slice(0, 400) || null,
      description: String(body.description || '').trim().slice(0, 8000) || null,
      kind: isEventKind(body.kind) ? body.kind : 'other',
      host: String(body.host || '').trim().slice(0, 160) || null,
      location: String(body.location || '').trim().slice(0, 200) || null,
      is_online: body.is_online === true,
      starts_at: startsAt,
      ends_at: endsAt,
      booking_url: String(body.booking_url || '').trim().slice(0, 500) || null,
      image_url: String(body.image_url || '').trim().slice(0, 500) || null,
      members_only: body.members_only === true,
      is_published: body.is_published === true,
      updated_at: new Date().toISOString(),
    }

    if (body.id) {
      const { error } = await admin.from('events').update(row).eq('id', String(body.id))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: body.id })
    }
    const { data, error } = await admin.from('events').insert(row).select('id').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  }

  if (action === 'delete') {
    const { error } = await admin.from('events').delete().eq('id', String(body.id || ''))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'announce') {
    const { data: event, error: readError } = await admin.from('events')
      .select('*').eq('id', String(body.id || '')).maybeSingle()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    if (!event.is_published) {
      return NextResponse.json({ error: 'Publish it first. Nobody should be emailed a page they cannot open.' }, { status: 400 })
    }
    if (event.announced_at) {
      return NextResponse.json({ error: 'The register has already been told about this one.' }, { status: 400 })
    }

    // Talent only. A brand launch is not news a hotel's finance team wants,
    // and the promise being kept here was made to professionals.
    const audience = await consentedRecipients(admin, 'candidates')
    if (!audience.recipients.length) {
      return NextResponse.json({
        error: 'Nobody on the register has confirmed marketing consent yet, so there is nobody to tell.',
        excluded_without_confirmed_consent: audience.excludedWithoutConsent,
      }, { status: 400 })
    }
    if (audience.recipients.length > MAX_PER_SEND) {
      return NextResponse.json({ error: `That is ${audience.recipients.length} people, above the ${MAX_PER_SEND} cap for one send.` }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    for (let index = 0; index < audience.recipients.length; index += 10) {
      const batch = audience.recipients.slice(index, index + 10)
      const results = await Promise.allSettled(batch.map(recipient => sendTransactionalEmail({
        to: recipient.email,
        subject: `First to know: ${event.title}`,
        html: announcementHtml(event),
        kind: 'marketing',
        unsubscribeUrl: recipient.unsubscribe,
      })))
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.ok) sent++
        else failed++
      }
    }

    // Written after the send, so a run that died halfway can be finished
    // rather than being locked out by a flag set before anything went.
    //
    // And checked, because this flag is the only thing standing between one
    // announcement and two. If it does not save, several hundred people are
    // one press away from hearing about the same event twice, and the person
    // holding the button is the only one who can stop it.
    const { error: flagError } = await admin.from('events')
      .update({ announced_at: new Date().toISOString() }).eq('id', event.id)

    return NextResponse.json({
      success: true, sent, failed,
      excluded_without_confirmed_consent: audience.excludedWithoutConsent,
      warning: flagError
        ? `Sent to ${sent} people, but we could not mark this event as announced. Do not press it again: it would send a second time.`
        : undefined,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

const escape = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function announcementHtml(event: any): string {
  const when = eventDateLabel(event.starts_at, event.ends_at)
  const where = eventWhereLabel(event)
  const link = `${SITE}/events/${event.slug}`
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:580px;margin:32px auto;border:1px solid #dcd4c8;">
      <div style="background:#28322b;padding:26px 32px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">First to know</p>
        <p style="margin:0;color:#ffffff;font-size:23px;font-weight:600;">${escape(event.title)}</p>
      </div>
      ${event.image_url ? `<img src="${escape(event.image_url)}" alt="" style="display:block;width:100%;height:auto;" />` : ''}
      <div style="padding:28px 32px;">
        <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6e6a60;">${escape(eventKindLabel(event.kind))}${event.host ? ` &middot; ${escape(event.host)}` : ''}</p>
        <p style="margin:10px 0 0;font-size:16px;font-weight:600;color:#222321;">${escape(when)}</p>
        <p style="margin:4px 0 0;font-size:15px;color:#3a3832;">${escape(where)}</p>
        ${event.summary ? `<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#3a3832;">${escape(event.summary)}</p>` : ''}
        <p style="margin:24px 0 0;">
          <a href="${link}" style="display:inline-block;background:#222321;color:#ffffff;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:600;">See the details</a>
        </p>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.7;color:#6e6a60;">
          You are on the Talent House register, so you hear about these before they are announced anywhere else.
        </p>
        <p style="margin:20px 0 0;font-size:12px;color:#6e6a60;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
