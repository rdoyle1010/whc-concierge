import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/send-email'
import { administratorEmails } from '@/lib/administrators'
import { cleanEmail, cleanWebsiteUrl, secureImageUrl } from '@/lib/brand-profiles'

// A brand applying for a page.
//
// The fields are the page's own fields on purpose. A brand that fills this in
// has written most of its own entry, so what lands in admin is a draft to edit
// rather than a lead to chase - and the brand has done the one part nobody
// else can do, which is explain why a spa should stock it in their own words.

// The shared limiter, not the per-container one. A Map inside a serverless
// function is one counter per instance, so "five an hour" was really five an
// hour per container - and a cold start handed out five more. These are the
// two public forms on the site that anyone can post to without an account.

const trim = (value: unknown, limit: number) => String(value ?? '').trim().slice(0, limit)
const listOf = (value: unknown, limit: number) =>
  (Array.isArray(value) ? value : String(value ?? '').split('\n'))
    .map(item => String(item ?? '').trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, limit)

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'brand-apply', { windowMs: 60 * 60 * 1000, maxRequests: 5 })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many applications from this connection. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  const body = await req.json().catch(() => ({}))
  if (trim(body.company, 200)) return NextResponse.json({ success: true })

  const brandName = trim(body.brand_name, 140)
  const contactName = trim(body.contact_name, 140)
  const contactEmail = cleanEmail(body.contact_email)
  if (!brandName) return NextResponse.json({ error: 'Tell us the name of the brand.' }, { status: 400 })
  if (!contactName) return NextResponse.json({ error: 'Tell us who you are.' }, { status: 400 })
  if (!contactEmail) return NextResponse.json({ error: 'Enter a valid email address so we can reply.' }, { status: 400 })

  const application = {
    brand_name: brandName,
    website_url: cleanWebsiteUrl(body.website_url),
    contact_name: contactName,
    contact_role: trim(body.contact_role, 140) || null,
    contact_email: contactEmail,
    contact_phone: trim(body.contact_phone, 60) || null,
    usp: trim(body.usp, 1000) || null,
    why_spas: trim(body.why_spas, 4000) || null,
    why_therapists_love_it: trim(body.why_therapists_love_it, 4000) || null,
    how_to_sell: trim(body.how_to_sell, 4000) || null,
    director_quote: trim(body.director_quote, 2000) || null,
    director_name: trim(body.director_name, 140) || null,
    director_role: trim(body.director_role, 140) || null,
    founded: trim(body.founded, 120) || null,
    origin: trim(body.origin, 200) || null,
    hero_ingredients: listOf(body.hero_ingredients, 12),
    signature_treatments: listOf(body.signature_treatments, 16),
    notable_partners: listOf(body.notable_partners, 16),
    offers_masterclass: Boolean(body.offers_masterclass),
  }

  const admin = createAdminClient()
  const { error } = await admin.from('brand_applications').insert(application)
  if (error) {
    console.error('[Brand application] could not be stored:', error.message)
    return NextResponse.json({ error: 'Your application could not be sent. Please try again.' }, { status: 500 })
  }

  const html = `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 28px;">Talent House Collective</p>
      <p style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">${escape(brandName)} would like a brand page</p>
      <p style="font-size: 13px; color: #6b6b6b; margin-bottom: 22px;">
        ${application.offers_masterclass ? 'They have offered the Academy a masterclass.' : 'No masterclass offered yet.'}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
        <tr><td style="padding: 7px 0; color: #6b6b6b; font-size: 13px; width: 130px;">Contact</td><td style="padding: 7px 0; font-size: 14px; color: #1c1c1c;">${escape(contactName)}${application.contact_role ? `, ${escape(application.contact_role)}` : ''}</td></tr>
        <tr><td style="padding: 7px 0; color: #6b6b6b; font-size: 13px;">Email</td><td style="padding: 7px 0; font-size: 14px;">${escape(contactEmail)}</td></tr>
        ${application.contact_phone ? `<tr><td style="padding: 7px 0; color: #6b6b6b; font-size: 13px;">Phone</td><td style="padding: 7px 0; font-size: 14px; color: #1c1c1c;">${escape(application.contact_phone)}</td></tr>` : ''}
        ${application.website_url ? `<tr><td style="padding: 7px 0; color: #6b6b6b; font-size: 13px;">Website</td><td style="padding: 7px 0; font-size: 14px;">${escape(application.website_url)}</td></tr>` : ''}
      </table>
      ${application.usp ? `<div style="background: #f1f1f1; padding: 16px; margin-bottom: 16px;"><p style="font-size: 12px; color: #6b6b6b; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .05em;">Their proposition</p><p style="font-size: 14px; color: #374151; line-height: 1.7; margin: 0; white-space: pre-wrap;">${escape(application.usp)}</p></div>` : ''}
      <p style="font-size: 13px; color: #555555;">The full application is in Admin, Brands, where it can be turned into a draft page in one click.</p>
    </div>
  `

  await Promise.allSettled(
    (await administratorEmails()).map(to =>
      sendTransactionalEmail({ to, subject: `Brand page application: ${brandName}`, html, kind: 'admin_alert' })),
  )

  return NextResponse.json({ success: true })
}
