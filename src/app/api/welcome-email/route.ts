import { NextRequest, NextResponse } from 'next/server'
import { welcomeEmailHtml } from '@/lib/welcome-email-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, userType } = await req.json()

    if (!email || !firstName || !userType) {
      return NextResponse.json({ error: 'Missing required fields: email, firstName, userType' }, { status: 400 })
    }

    const dashboardUrl = userType === 'employer'
      ? 'https://talent.wellnesshousecollective.co.uk/employer/dashboard'
      : 'https://talent.wellnesshousecollective.co.uk/talent/dashboard'

    const html = welcomeEmailHtml({ firstName, userType, dashboardUrl })

    if (!RESEND_API_KEY) {
      console.log(`[Welcome email skipped - no API key] To: ${email}, Name: ${firstName}, Type: ${userType}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to WHC Concierge',
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
