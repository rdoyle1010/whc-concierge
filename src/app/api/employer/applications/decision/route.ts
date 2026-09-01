import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { trackEvent } from '@/lib/analytics'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'
import { emailAllowed } from '@/lib/notification-prefs'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

const ALLOWED = ['shortlisted', 'rejected', 'accepted'] as const
type Decision = typeof ALLOWED[number]

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function messageHtml(opts: { note: string; jobTitle: string; propertyName: string; decision: Decision }) {
  const label = opts.decision === 'shortlisted' ? 'Shortlisted' : opts.decision === 'accepted' ? 'Offer update' : 'Application update'
  const safeNote = escapeHtml(opts.note).replaceAll('\n', '<br>')
  return `<!doctype html><html lang="en"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#10283b;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:36px 16px;"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e5e5;"><tr><td style="background:#0b2f4d;padding:30px 36px;"><p style="margin:0 0 7px;color:#ffffff;opacity:.8;font-size:10px;letter-spacing:2px;text-transform:uppercase;">${label}</p><h1 style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:600;">WHC Concierge</h1></td></tr><tr><td style="padding:34px 36px;"><p style="margin:0 0 18px;color:#10283b;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;">${escapeHtml(opts.jobTitle)} · ${escapeHtml(opts.propertyName)}</p><div style="font-size:14px;line-height:1.75;color:#405262;">${safeNote}</div><p style="margin:28px 0 0;"><a href="https://talent.wellnesshousecollective.co.uk/talent/applications" style="display:inline-block;background:#0b2f4d;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:13px;font-weight:600;">View application progress</a></p></td></tr><tr><td style="padding:20px 36px;border-top:1px solid #e5e5e5;color:#6b7580;font-size:11px;">Wellness House Collective · WHC Concierge</td></tr></table></td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Your session could not be verified. Please sign in again.' }, { status: 401 })

    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const decision = String(body.decision || '') as Decision
    const note = String(body.note || '').trim()
    if (!applicationId || !ALLOWED.includes(decision)) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    if (note.length < 20 || note.length > 3000) return NextResponse.json({ error: 'Please review the candidate message before sending.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer, error: employerError } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (employerError) return NextResponse.json({ error: `Could not load employer profile: ${employerError.message}` }, { status: 500 })
    if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

    const { data: application, error: applicationError } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (applicationError) return NextResponse.json({ error: `Could not load application: ${applicationError.message}` }, { status: 500 })
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (['withdrawn', 'accepted'].includes(application.status) && decision !== application.status) return NextResponse.json({ error: 'This application can no longer be changed from its current stage.' }, { status: 409 })
    // A draft has not been sent by the candidate - it must never be actioned.
    if (application.status === 'draft') return NextResponse.json({ error: 'This candidate has not sent their application yet.' }, { status: 409 })

    const { data: liveOffer, error: offerError } = await admin.from('application_offers').select('id,status').eq('application_id', application.id).in('status', ['offered', 'accepted']).maybeSingle()
    if (offerError) return NextResponse.json({ error: `Could not check live offer: ${offerError.message}` }, { status: 500 })
    if (decision === 'rejected' && liveOffer) return NextResponse.json({ error: 'This candidate already has a live job offer. Withdraw or resolve the offer before marking the application as not progressing.' }, { status: 409 })

    const jobId = application.role_id || application.job_id
    const { data: job, error: jobError } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (jobError) return NextResponse.json({ error: `Could not load job: ${jobError.message}` }, { status: 500 })
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'This application does not belong to the signed-in employer.' }, { status: 403 })

    const { data: updated, error: updateError } = await admin.from('applications')
      .update({ status: decision, updated_at: new Date().toISOString() })
      .eq('id', application.id)
      .select('id,status')
      .maybeSingle()
    if (updated) {
      const eventName = decision === 'shortlisted' ? 'candidate_shortlisted' : decision === 'rejected' ? 'application_rejected' : 'application_progressed'
      await trackEvent(eventName, { actorUserId: user.id, candidateId: application.candidate_id, employerId: employer.id, jobId: job.id, applicationId: application.id })
    }
    if (updateError || !updated) return NextResponse.json({ error: updateError?.message || 'Could not save the application decision.' }, { status: 500 })

    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name').eq('id', application.candidate_id).maybeSingle()
    const propertyName = employer.property_name || employer.company_name || 'the property'
    const title = decision === 'shortlisted' ? `You have been shortlisted for ${job.job_title}` : decision === 'accepted' ? `Your application for ${job.job_title} has progressed` : `Update on your application for ${job.job_title}`

    let notificationSent = false
    let emailSent = false
    let smsSent = false

    if (candidate?.user_id) {
      try {
        await createNotification(candidate.user_id, 'general', title, note.slice(0, 500), '/talent/applications')
        notificationSent = true
      } catch (notificationError: any) {
        console.error('Recruitment decision notification failed:', notificationError?.message || notificationError)
      }

      try {
        // Preference-gated ('application_updates'): shortlist/decision emails
        // honour the candidate's opt-out; the in-app notification above always
        // fires. Fail-open on lookup errors.
        const wantsEmail = await emailAllowed(admin, candidate.user_id, 'application_updates')
        const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
        const email = authUser?.user?.email || null
        if (email && RESEND_API_KEY && wantsEmail) {
          const subject = decision === 'shortlisted' ? `You have been shortlisted - ${job.job_title}` : decision === 'accepted' ? `Application update - ${job.job_title}` : `Update on your application - ${job.job_title}`
          const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html: messageHtml({ note, jobTitle: job.job_title, propertyName, decision }) }) })
          emailSent = res.ok
          if (!res.ok) console.error('Recruitment decision email failed:', res.status, (await res.text().catch(() => '')).slice(0, 300))
        }
      } catch (emailError: any) {
        console.error('Recruitment decision email lookup/send failed:', emailError?.message || emailError)
      }

      if (decision === 'shortlisted') {
        try {
          const { data: smsCandidate } = await admin.from('candidate_profiles').select('phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle()
          if (smsCandidate) smsSent = await sendSmsIfOptedIn({ to: smsCandidate.phone, optedIn: smsCandidate.sms_opt_in, body: `WHC Concierge: Congratulations, you have been shortlisted for ${job.job_title} at ${propertyName}. Open My Applications for the update.` })
        } catch (smsError: any) {
          console.error('Recruitment decision SMS failed:', smsError?.message || smsError)
        }
      }
    }

    return NextResponse.json({ success: true, status: updated.status, notificationSent, emailSent, smsSent })
  } catch (error: any) {
    console.error('Employer application decision failed:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Could not save the application decision.' }, { status: 500 })
  }
}
