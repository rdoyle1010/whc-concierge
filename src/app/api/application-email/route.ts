import { NextRequest, NextResponse } from 'next/server'
import { applicantConfirmationHtml, employerNotificationHtml } from '@/lib/application-email-templates'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Application email skipped - no API key] To: ${to}, Subject: ${subject}`)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { applicantEmail, applicantName, employerEmail, employerName, jobTitle, propertyName, roleLevel } = await req.json()

    if (!applicantEmail || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const property = propertyName || employerName || 'the employer'

    // Send both emails in parallel
    const promises: Promise<void>[] = []

    // Email A: confirmation to applicant
    promises.push(
      send(
        applicantEmail,
        `Application Received — ${jobTitle}`,
        applicantConfirmationHtml({ applicantName: applicantName || 'there', jobTitle, propertyName: property }),
      )
    )

    // Email B: notification to employer
    if (employerEmail) {
      promises.push(
        send(
          employerEmail,
          `New Application — ${jobTitle}`,
          employerNotificationHtml({ applicantName: applicantName || 'A candidate', jobTitle, propertyName: property, roleLevel }),
        )
      )
    }

    await Promise.all(promises)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Application email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
