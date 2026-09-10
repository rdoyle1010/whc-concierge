import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/send-email'
import { administratorEmails } from '@/lib/administrators'
import { cleanBrandSlug, cleanEmail } from '@/lib/brand-profiles'

// A spa director asking a brand for the full picture.
//
// The enquiry goes two places: to Talent House, because an enquiry is the only
// evidence a brand page is worth anything, and to the brand's own named
// contact, because a lead that sits in our inbox waiting to be forwarded is a
// lead we have made slower than the brand's website.

// The shared limiter, not the per-container one: an in-memory Map counts per
// serverless instance, so the limit reset on every cold start.

const trim = (value: unknown, limit: number) => String(value ?? '').trim().slice(0, limit)

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'brand-enquire', { windowMs: 15 * 60 * 1000, maxRequests: 6 })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many enquiries from this connection. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  const body = await req.json().catch(() => ({}))

  // The honeypot. A person never sees the field, so anything in it is a bot,
  // and it is answered with a success it will not learn anything from.
  if (trim(body.company, 200)) return NextResponse.json({ success: true })

  const brandSlug = cleanBrandSlug(body.brand_slug)
  const contactName = trim(body.contact_name, 140)
  const contactEmail = cleanEmail(body.contact_email)
  if (!brandSlug) return NextResponse.json({ error: 'Which brand?' }, { status: 400 })
  if (!contactName) return NextResponse.json({ error: 'Please tell them your name.' }, { status: 400 })
  if (!contactEmail) return NextResponse.json({ error: 'Please enter a valid email address so they can reply.' }, { status: 400 })

  const admin = createAdminClient()

  // The brand is read from the database rather than the request, so a posted
  // brand name cannot put words in somebody else's mouth in the email we send.
  const { data: brand } = await admin
    .from('brand_profiles')
    .select('name, contact_email, is_published')
    .eq('slug', brandSlug)
    .maybeSingle()
  if (!brand || !brand.is_published) return NextResponse.json({ error: 'That brand is not listed.' }, { status: 404 })

  const enquiry = {
    brand_slug: brandSlug,
    brand_name: brand.name,
    property_name: trim(body.property_name, 200) || null,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: trim(body.contact_phone, 60) || null,
    role_title: trim(body.role_title, 140) || null,
    treatment_rooms: trim(body.treatment_rooms, 60) || null,
    message: trim(body.message, 4000) || null,
  }

  const { error } = await admin.from('brand_enquiries').insert(enquiry)
  if (error) {
    console.error('[Brand enquiry] could not be stored:', error.message)
    return NextResponse.json({ error: 'Your enquiry could not be sent. Please try again.' }, { status: 500 })
  }

  const rows = [
    ['Brand', brand.name],
    ['From', enquiry.contact_name],
    ['Email', enquiry.contact_email],
    ['Phone', enquiry.contact_phone],
    ['Spa or property', enquiry.property_name],
    ['Role', enquiry.role_title],
    ['Treatment rooms', enquiry.treatment_rooms],
  ].filter(([, value]) => Boolean(value)) as [string, string][]

  const html = `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 28px;">Talent House Collective</p>
      <p style="font-size: 20px; font-weight: 700; margin-bottom: 18px;">A spa is asking about ${escape(brand.name)}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
        ${rows.map(([label, value]) => `<tr><td style="padding: 7px 0; color: #6b6b6b; font-size: 13px; width: 140px;">${escape(label)}</td><td style="padding: 7px 0; font-size: 14px; color: #1c1c1c;">${escape(value)}</td></tr>`).join('')}
      </table>
      ${enquiry.message ? `<div style="background: #f1f1f1; padding: 16px; margin-bottom: 22px;"><p style="font-size: 12px; color: #6b6b6b; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .05em;">What they asked</p><p style="font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap; margin: 0;">${escape(enquiry.message)}</p></div>` : ''}
      <p style="font-size: 12px; color: #6b6b6b;">Reply to them directly at ${escape(enquiry.contact_email)}.</p>
    </div>
  `

  // Both recipients, and neither failure stops the other or loses the row that
  // is already saved. An enquiry we hold but did not manage to email is still
  // an enquiry we can act on; one we neither held nor emailed is gone.
  const recipients = new Set<string>(await administratorEmails())
  if (brand.contact_email) recipients.add(String(brand.contact_email))
  await Promise.allSettled(
    [...recipients].map(to => sendTransactionalEmail({ to, subject: `Brand enquiry: ${brand.name}`, html, kind: 'admin_alert' })),
  )

  return NextResponse.json({ success: true })
}
