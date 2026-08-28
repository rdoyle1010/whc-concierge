import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Spa Platform <noreply@mail.wellnesshousecollective.co.uk>'

const ALLOWED = ['shortlisted', 'rejected'] as const
type Decision = typeof ALLOWED[number]

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function messageHtml(opts: { note: string; jobTitle: string; propertyName: string; decision: Decision }) {
  const label = opts.decision === 'shortlisted' ? 'Shortlisted' : 'Application update'
  const safeNote = escapeHtml(opts.note).replaceAll('\n', '<br>')
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f5f3ee;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17344d;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:36px 16px;"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:18px;overflow:hidden;"><tr><td style="background:#0b2f4d;padding:30px 36px;"><p style="margin:0 0 7px;color:#c9a96e;font-size:10px;letter-spacing:2px;text-transform:uppercase;">${label}</p><h1 style="margin:0;color:white;font-family:Georgia,serif;font-size:25px;font-weight:500;">Spa Platform</h1></td></tr><tr><td style="padding:34px 36px;"><p style="margin:0 0 18px;color:#9c7a42;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;">${escapeHtml(opts.jobTitle)} · ${escapeHtml(opts.propertyName)}</p><div style="font-size:14px;line-height:1.75;color:#405262;">${safeNote}</div><p style="margin:28px 0 0;"><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:white;text-decoration:none;padding:12px 20px;border-radius:9px;font-size:13px;font-weight:600;">View application progress</a></p></td></tr><tr><td style="padding:20px 36px;border-top:1px solid #eee8dc;color:#9b958b;font-size:11px;">Wellness House Collective · Spa Platform</td></tr></table></td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const decision = String(body.decision || '') as Decision
    const note = String(body.note || '').trim()
    if (!applicationId || !ALLOWED.includes(decision)) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    if (note.length < 20 || note.length > 3000) return NextResponse.json({ error: 'Please review the candidate message before sending.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    if (decision === 'shortlisted' && !['pending', 'reviewed', 'shortlisted'].includes(application.status)) {
      return NextResponse.json({ error: 'Only an application under review can be shortlisted.' }, { status: 409 })
    }
    if (decision === 'rejected' && !['pending', 'reviewed', 'shortlisted', 'interview', 'rejected'].includes(application.status)) {
      return NextResponse.json({ error: 'This application can no longer be marked as not progressing.' }, { status: 409 })
    }

    const { data: liveOffer } = await admin.from('application_offers').select('id,status').eq('application_id', application.id).in('status', ['offered', 'accepted']).maybeSingle()
    if (decision === 'rejected' && liveOffer) return NextResponse.json({ error: 'This candidate already has a live job offer. Withdraw or resolve the offer before marking the application as not progressing.' }, { status: 409 })

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name,phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate?.user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error: updateError } = await admin.from('applications').update({ status: decision, updated_at: new Date().toISOString() }).eq('id', application.id)
    if (updateError) return NextResponse.json({ error: 'Could not update application.' }, { status: 500 })

    const propertyName = employer.property_name || employer.company_name || 'the property'
    const title = decision === 'shortlisted' ? `You have been shortlisted for ${job.job_title}` : `Update on your application for ${job.job_title}`
    await createNotification(candidate.user_id, 'general', title, note.slice(0, 500), '/talent/applications')

    const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
    const email = authUser?.user?.email || null
    let emailSent = false
    if (email && RESEND_API_KEY) {
      const subject = decision === 'shortlisted' ? `You have been shortlisted - ${job.job_title}` : `Update on your application - ${job.job_title}`
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html: messageHtml({ note, jobTitle: job.job_title, propertyName, decision }) }) })
      emailSent = res.ok
      if (!res.ok) console.error('Recruitment decision email failed:', res.status, (await res.text().catch(() => '')).slice(0, 300))
    }

    let smsSent = false
    if (decision === 'shortlisted') {
      smsSent = await sendSmsIfOptedIn({ to: candidate.phone, optedIn: candidate.sms_opt_in, body: `Spa Platform: Congratulations, you have been shortlisted for ${job.job_title} at ${propertyName}. Open My Applications for the update.` })
    }

    return NextResponse.json({ success: true, status: decision, emailSent, smsSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not update application.' }, { status: 500 })
  }
}
