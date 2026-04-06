import { NextRequest, NextResponse } from 'next/server'
import { approvalEmailHtml, rejectionEmailHtml } from '@/lib/decision-email-templates'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

export async function POST(req: NextRequest) {
  try {
    const { applicantEmail, applicantName, jobTitle, propertyName, decision } = await req.json()

    if (!applicantEmail || !jobTitle || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const property = propertyName || 'the employer'
    const name = applicantName || 'there'

    let subject: string
    let html: string

    if (decision === 'approved' || decision === 'shortlisted' || decision === 'accepted') {
      subject = `Great News — Your Application for ${jobTitle} Has Been Shortlisted`
      html = approvalEmailHtml({ applicantName: name, jobTitle, propertyName: property })
    } else {
      subject = `Update on Your Application for ${jobTitle}`
      html = rejectionEmailHtml({ applicantName: name, jobTitle, propertyName: property })
    }

    if (!RESEND_API_KEY) {
      console.log(`[Decision email skipped - no API key] To: ${applicantEmail}, Decision: ${decision}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: applicantEmail, subject, html }),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Decision email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
