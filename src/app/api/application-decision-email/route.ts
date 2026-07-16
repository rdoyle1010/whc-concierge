import { NextRequest, NextResponse } from 'next/server'
import { approvalEmailHtml, rejectionEmailHtml } from '@/lib/decision-email-templates'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

export async function POST(req: NextRequest) {
  try {
    // Auth: only logged-in users may trigger decision emails (was open to anyone)
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { applicantEmail, applicantName, jobTitle, propertyName, decision, candidateUserId } = await req.json()

    // Candidate emails live in auth.users, not candidate_profiles - look the
    // address up server-side (the old client-side email guard never passed).
    let toEmail: string | null = applicantEmail || null
    if (!toEmail && candidateUserId) {
      const admin = createAdminClient()
      const { data: authUser } = await admin.auth.admin.getUserById(candidateUserId)
      toEmail = authUser?.user?.email || null
    }

    if (!toEmail || !jobTitle || !decision) {
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
      console.log(`[Decision email skipped - no API key] To: ${toEmail}, Decision: ${decision}`)
      return NextResponse.json({ success: true, skipped: true })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: toEmail, subject, html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[Decision email FAILED ${res.status}] To: ${toEmail} — ${detail.slice(0, 300)}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Decision email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
