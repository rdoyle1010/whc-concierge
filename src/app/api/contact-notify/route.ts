import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { contactFormSchema, validateRequest } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'

const limiter = rateLimit('contact-notify', { windowMs: 15 * 60 * 1000, maxRequests: 5 })

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'
// Fallback only - the admin-configured platform_config contact_email wins.
const DEFAULT_ADMIN_EMAIL = 'rebecca.whc@outlook.com'

async function getNotificationRecipient(): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('platform_config').select('value').eq('key', 'contact_email').maybeSingle()
    const configured = String(data?.value || '').trim()
    if (configured && configured.includes('@')) return configured
  } catch { /* fall back to the default address */ }
  return DEFAULT_ADMIN_EMAIL
}

export async function POST(req: NextRequest) {
  const { success, remaining } = limiter.check(getClientIp(req))
  if (!success) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'X-RateLimit-Remaining': '0' } })

  try {
    const body = await req.json()
    const validation = validateRequest(contactFormSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    }
    const { name, email, subject, message, type } = validation.data!

    const emailSubject = `New WHC Contact: ${type || 'general'} - ${subject}`

    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">WHC Concierge</p>
        <p style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">New Contact Form Submission</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #8a949b; font-size: 13px; width: 100px;">Name</td><td style="padding: 8px 0; font-size: 14px; color: #10283b; font-weight: 500;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a949b; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #5a6a76;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #8a949b; font-size: 13px;">Type</td><td style="padding: 8px 0; font-size: 14px; color: #10283b; text-transform: capitalize;">${type || 'general'}</td></tr>
          <tr><td style="padding: 8px 0; color: #8a949b; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px; color: #10283b; font-weight: 500;">${subject}</td></tr>
        </table>
        <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #8a949b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
          <p style="font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #8a949b;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
      </div>
    `

    const recipient = await getNotificationRecipient()

    if (!RESEND_API_KEY) {
      console.log(`[Email skipped - no API key] To: ${recipient}, Subject: ${emailSubject}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: recipient, subject: emailSubject, html }),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact notify failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
