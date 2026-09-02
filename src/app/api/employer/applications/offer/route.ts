import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { trackEvent } from '@/lib/analytics'
import { createNotification } from '@/lib/notifications'
import { sendSmsIfOptedIn } from '@/lib/sms'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

function escapeHtml(value: string) {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const note = String(body.note || '').trim().slice(0, 3000)
    if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })
    if (note.length < 20) return NextResponse.json({ error: 'Review the offer message before sending it.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    if (!['interview','offered'].includes(application.status)) return NextResponse.json({ error: 'Invite the candidate to interview before making an offer.' }, { status: 409 })

    // An offer requires an interview that has actually been held: either marked
    // completed, or confirmed by the candidate with its time now in the past.
    const { data: interviews } = await admin.from('application_interviews')
      .select('id,status,selected_slot')
      .eq('application_id', applicationId)
    const interviewHeld = (interviews || []).some((interview: any) =>
      interview.status === 'completed' ||
      (interview.status === 'confirmed' && interview.selected_slot && new Date(interview.selected_slot).getTime() <= Date.now()))
    if (!interviewHeld && application.status !== 'offered') {
      return NextResponse.json({ error: 'An offer can be made once an interview has been confirmed and has taken place.' }, { status: 409 })
    }

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name,phone,sms_opt_in').eq('id', application.candidate_id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate?.user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: offer, error } = await admin.from('application_offers').upsert({
      application_id: application.id,
      salary_amount: null,
      salary_period: 'annual',
      start_date: null,
      employer_note: note,
      status: 'offered',
      offered_at: new Date().toISOString(),
      responded_at: null,
      candidate_note: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'application_id' }).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not create the offer.' }, { status: 500 })

    await admin.from('applications').update({ status: 'offered', updated_at: new Date().toISOString() }).eq('id', application.id)
    const propertyName = employer.property_name || employer.company_name || 'The property'
    await createNotification(candidate.user_id, 'general', `Job offer - ${job.job_title}`, `${propertyName} would like to offer you the role. Review the message in My Applications.`, '/talent/applications')

    const smsSent = await sendSmsIfOptedIn({
      to: candidate.phone,
      optedIn: candidate.sms_opt_in,
      body: `Talent House Collective: Congratulations - ${propertyName} would like to offer you the ${job.job_title} role. Open My Applications to review and respond.`,
    })

    // The offer is the most important email on the platform - send it as well
    // as the in-app notification and SMS.
    let emailSent = false
    if (RESEND_API_KEY) {
      try {
        const { data: candidateUser } = await admin.auth.admin.getUserById(candidate.user_id)
        const candidateEmail = candidateUser?.user?.email
        if (candidateEmail) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: candidateEmail,
              subject: `Job offer - ${job.job_title} at ${propertyName}`,
              html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;color:#1c1b1a"><div style="background:#1c1b1a;padding:24px 32px;"><p style="margin:0 0 6px;color:#ffffff;opacity:.8;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Job offer</p><h1 style="margin:0;color:#ffffff;font-size:23px;font-weight:600;">Talent House Collective</h1></div><div style="padding:28px 32px;"><h2 style="font-weight:600;margin:0 0 12px;">Congratulations, ${escapeHtml(candidate.full_name || 'there')}</h2><p style="line-height:1.6">${escapeHtml(propertyName)} would like to offer you the role of <strong>${escapeHtml(job.job_title)}</strong>.</p><div style="background:#f7f7f7;border:1px solid #e5e5e5;padding:16px 20px;margin:20px 0;line-height:1.6;white-space:pre-wrap">${escapeHtml(note)}</div><p style="line-height:1.6">Sign in to review the offer and respond.</p><p style="margin:28px 0"><a href="https://talenthousecollective.co.uk/talent/applications" style="background:#1c1b1a;color:#ffffff;padding:12px 24px;text-decoration:none">Review your offer</a></p><p style="color:#777;font-size:13px">Wellness House Collective · Talent House Collective</p></div></div>`,
            }),
          })
          emailSent = response.ok
          if (!response.ok) console.error('Offer email failed:', await response.text().catch(() => response.status))
        }
      } catch (emailError: any) {
        console.error('Offer email failed:', emailError?.message)
      }
    }

    await trackEvent('offer_created', { actorUserId: user.id, candidateId: application.candidate_id, employerId: employer.id, jobId: job.id, applicationId: application.id })
    return NextResponse.json({ success: true, offer, smsSent, emailSent })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not create the offer.' }, { status: 500 })
  }
}
