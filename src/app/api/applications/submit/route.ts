import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { applicantConfirmationHtml, employerNotificationHtml } from '@/lib/application-email-templates'
import { emailAllowed } from '@/lib/notification-prefs'
import { trackEvent } from '@/lib/analytics'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) console.error(`[Email FAILED ${res.status}] ${subject}`)
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { applicationId, coverLetter } = await req.json()
  if (!applicationId) return NextResponse.json({ error: 'Application is required' }, { status: 400 })

  const letter = String(coverLetter || '').trim()
  if (letter.length > 5000) return NextResponse.json({ error: 'Covering letter must be 5,000 characters or fewer.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

  const { data: application } = await admin.from('applications')
    .select('id,candidate_id,role_id,status,match_score')
    .eq('id', applicationId)
    .maybeSingle()

  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (application.status !== 'draft') return NextResponse.json({ error: 'This application has already been sent.' }, { status: 409 })

  const { data: job } = await admin.from('job_listings').select('*').eq('id', application.role_id).maybeSingle()
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) {
    return NextResponse.json({ error: 'This role is no longer available.' }, { status: 409 })
  }

  const { data: employer } = await admin.from('employer_profiles').select('*').eq('id', job.employer_id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const now = new Date().toISOString()
  const { data: updatedApplication, error: updateError } = await admin.from('applications').update({
    status: 'pending',
    cover_letter: letter,
    cover_note: letter || null,
    submitted_at: now,
    updated_at: now,
  }).eq('id', application.id).eq('status', 'draft').select('id,status,submitted_at,updated_at').maybeSingle()

  if (updateError || !updatedApplication) return NextResponse.json({ error: 'Could not send your application.' }, { status: 500 })

  const { error: swipeError } = await admin.from('swipes').upsert({
    swiper_id: user.id,
    swiper_type: 'candidate',
    target_id: job.id,
    target_type: 'job',
    action: 'right',
    context_job_id: job.id,
  }, {
    onConflict: 'swiper_id,swiper_type,target_id,target_type,context_job_id',
    ignoreDuplicates: false,
  })
  if (swipeError) {
    // The application itself has already been submitted successfully. A failure
    // recording the secondary interest row must not fail the whole request -
    // that would show the talent an error (and skip the employer notification)
    // for an application that actually went through.
    console.error('Could not record submitted application as candidate interest:', swipeError.message)
  }

  const employerName = employer.property_name || employer.company_name || 'the employer'
  if (employer.user_id) {
    await createNotification(employer.user_id, 'job_application', 'New application received', `${candidate.full_name || 'A candidate'} applied for ${job.job_title}.`, '/employer/applications')
  }

  try {
    const jobs: Promise<void>[] = []
    // Always-send (transactional): the applicant's confirmation is a receipt
    // of their own action, so no preference gate applies to it.
    if (user.email) jobs.push(sendEmail(user.email, `Application Received - ${job.job_title}`, applicantConfirmationHtml({ applicantName: candidate.full_name || 'there', jobTitle: job.job_title, propertyName: employerName })))
    // Preference-gated ('application_updates'): the employer's new-application
    // email honours their opt-out; the in-app notification above always fires.
    if (await emailAllowed(admin, employer.user_id, 'application_updates')) {
      let employerEmail = employer.contact_email || null
      if (!employerEmail && employer.user_id) {
        const { data: employerUser } = await admin.auth.admin.getUserById(employer.user_id)
        employerEmail = employerUser?.user?.email || null
      }
      if (employerEmail) jobs.push(sendEmail(employerEmail, `New Application - ${job.job_title}`, employerNotificationHtml({ applicantName: candidate.full_name || 'A candidate', jobTitle: job.job_title, propertyName: employerName, roleLevel: candidate.role_level || undefined })))
    }
    await Promise.allSettled(jobs)
  } catch (e: any) { console.error('Application email failed:', e?.message) }

  await trackEvent('application_submitted', { actorUserId: user.id, candidateId: candidate.id, jobId: application.role_id, applicationId: application.id })

  return NextResponse.json({
    success: true,
    application: updatedApplication,
    progress: {
      current: 'submitted',
      next: 'under_review',
      message: 'Application submitted. The property can now review it.',
    },
  })
}
