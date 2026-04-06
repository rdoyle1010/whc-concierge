import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const limiter = rateLimit('contact-notify', { windowMs: 15 * 60 * 1000, maxRequests: 5 })

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'
const ADMIN_EMAIL = 'rebecca.whc@outlook.com'

export async function POST(req: NextRequest) {
  const { success, remaining } = limiter.check(getClientIp(req))
  if (!success) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'X-RateLimit-Remaining': '0' } })

  try {
    const { name, email, subject, message, type } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailSubject = `New WHC Contact: ${type || 'general'} — ${subject}`

    const html = `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">WHC Concierge</p>
        <p style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">New Contact Form Submission</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #9CA3AF; font-size: 13px; width: 100px;">Name</td><td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #9CA3AF; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #C9A96E;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #9CA3AF; font-size: 13px;">Type</td><td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; text-transform: capitalize;">${type || 'general'}</td></tr>
          <tr><td style="padding: 8px 0; color: #9CA3AF; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${subject}</td></tr>
        </table>
        <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 12px; color: #9CA3AF; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
          <p style="font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #9CA3AF;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
      </div>
    `

    if (!RESEND_API_KEY) {
      console.log(`[Email skipped - no API key] To: ${ADMIN_EMAIL}, Subject: ${emailSubject}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject: emailSubject, html }),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact notify failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
