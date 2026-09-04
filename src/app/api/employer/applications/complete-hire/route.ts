import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { sendRoleFilledEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
import { trackEvent, recordSalary } from '@/lib/analytics'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

function escapeHtml(value: string) {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
}

async function sendHireConfirmation(email: string, name: string, jobTitle: string, propertyName: string) {
  if (!RESEND_API_KEY) return false
  const firstName = (name || 'there').split(' ')[0]
  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;"><div style="max-width:580px;margin:32px auto;background:#ffffff;border:1px solid #e5e5e5;"><div style="background:#1c1c1c;padding:26px 34px;"><p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.8;">Congratulations</p><h1 style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:600;">Talent House Collective</h1></div><div style="padding:30px 34px;"><h2 style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:19px;">Congratulations, ${escapeHtml(firstName)}</h2><p style="line-height:1.7;color:#516371;">Your offer for <strong>${escapeHtml(jobTitle)}</strong> with <strong>${escapeHtml(propertyName)}</strong> has been accepted and the recruitment process on Talent House Collective is now complete.</p><p style="line-height:1.7;color:#516371;">Your employer will send any formal employment documents, contractual terms and onboarding information directly to you.</p><p style="line-height:1.7;color:#516371;">Your Talent House Collective account remains yours. You can access, update or request deletion of your personal information through Settings. Some recruitment records may be retained only where necessary for legitimate or legal purposes in line with our privacy notice.</p><p style="margin-top:26px;"><a href="https://talenthousecollective.co.uk/talent/settings" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:12px 18px;">Privacy & account settings</a></p><p style="margin-top:30px;font-size:12px;color:#6b6b6b;">Talent House Collective · Talent House Collective</p></div></div></body></html>`
  const res = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ Authorization:`Bearer ${RESEND_API_KEY}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ from:FROM_EMAIL, to:email, subject:`Congratulations - ${jobTitle} at ${propertyName}`, html }),
  })
  if (!res.ok) console.error('Hire confirmation email failed:', res.status, (await res.text().catch(()=>'' )).slice(0,300))
  return res.ok
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error:'Unauthorised' }, { status:401 })

  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error:'Your session could not be verified. Please sign in again.' }, { status:401 })

    const { applicationId } = await req.json()
    if (!applicationId) return NextResponse.json({ error:'Application is required.' }, { status:400 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error:'Employer profile not found.' }, { status:404 })

    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status,archived_at,hired_at').eq('id', applicationId).maybeSingle()
    if (!application) return NextResponse.json({ error:'Application not found.' }, { status:404 })
    // Guarded on hired_at, not archived_at.
    //
    // "Reopen record" on the employer's Hired page nulls archived_at, which
    // used to put a completed hire straight back into the pipeline as
    // "Complete successful hire" - and running it again re-sent the
    // congratulations email to the person hired and rejection emails to every
    // other applicant on the role. A hire that has happened has happened.
    if (application.hired_at || application.archived_at) return NextResponse.json({ success:true, alreadyCompleted:true })
    if (application.status !== 'accepted') return NextResponse.json({ error:'The candidate must accept the offer before the hire can be completed.' }, { status:409 })

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }, { data: acceptedOffer }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,user_id,full_name').eq('id', application.candidate_id).maybeSingle(),
      admin.from('application_offers').select('id,status,salary_amount,salary_period,start_date').eq('application_id', application.id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate?.user_id) return NextResponse.json({ error:'Forbidden' }, { status:403 })
    if (acceptedOffer?.status !== 'accepted') return NextResponse.json({ error:'The offer has not been accepted yet.' }, { status:409 })

    const now = new Date().toISOString()
    const propertyName = employer.property_name || employer.company_name || 'the property'

    const { error: hireError } = await admin.from('applications').update({ hired_at:now, archived_at:now, updated_at:now }).eq('id', application.id)
    if (hireError) return NextResponse.json({ error:'Could not archive the successful placement.' }, { status:500 })

    const { error: jobError } = await admin.from('job_listings').update({ is_live:false, status:'filled' }).eq('id', job.id)
    if (jobError) return NextResponse.json({ error:'The hire was recorded, but the role could not be closed.' }, { status:500 })

    // The permanent placement record - the platform's most valuable data
    // point. Best-effort: a recording failure never blocks the hire itself.
    try {
      const { data: placement } = await admin.from('placements').upsert({
        application_id: application.id,
        candidate_id: application.candidate_id,
        employer_id: employer.id,
        job_id: job.id,
        job_title: job.job_title || null,
        source: 'direct',
        salary_amount: acceptedOffer?.salary_amount ?? null,
        salary_period: acceptedOffer?.salary_period || 'annual',
        start_date: acceptedOffer?.start_date || null,
        hired_at: now,
      }, { onConflict: 'application_id' }).select('id').maybeSingle()
      if (acceptedOffer?.salary_amount) {
        await recordSalary({
          kind: 'confirmed', source: 'platform_transaction',
          amountMin: Number(acceptedOffer.salary_amount), amountMax: Number(acceptedOffer.salary_amount),
          period: (acceptedOffer.salary_period as any) || 'annual',
          candidateId: application.candidate_id, employerId: employer.id, jobId: job.id,
          placementId: placement?.id || null,
        })
      }
    } catch { /* best-effort */ }
    await trackEvent('hire_confirmed', { actorUserId: user.id, candidateId: application.candidate_id, employerId: employer.id, jobId: job.id, applicationId: application.id })

    const { data: otherApplications } = await admin.from('applications')
      .select('id,candidate_id,status')
      .or(`job_id.eq.${job.id},role_id.eq.${job.id}`)
      .neq('id', application.id)
      .is('archived_at', null)
      .in('status', ['pending','reviewed','shortlisted','interview','offered'])

    const otherRows = otherApplications || []
    const otherIds = otherRows.map(row => row.id)
    if (otherIds.length) {
      await admin.from('applications').update({ status:'rejected', updated_at:now }).in('id', otherIds)
      const otherCandidateIds = Array.from(new Set(otherRows.map(row => row.candidate_id).filter(Boolean))) as string[]
      if (otherCandidateIds.length) {
        const { data: others } = await admin.from('candidate_profiles').select('id,user_id,full_name').in('id', otherCandidateIds)
        for (const other of others || []) {
          if (!other.user_id) continue
          await createNotification(other.user_id, 'general', `${job.job_title} has been filled`, `Thank you for your interest in ${job.job_title} at ${propertyName}. The role has now been filled.`, '/talent/applications')
          // Preference-gated ('application_updates'): the role-filled email to
          // other applicants honours their opt-out; the in-app notification
          // above always fires. The hire confirmation to the successful
          // candidate below is contractual and always sends.
          if (await emailAllowed(admin, other.user_id, 'application_updates')) {
            const { data: authUser } = await admin.auth.admin.getUserById(other.user_id)
            if (authUser.user?.email) await sendRoleFilledEmail(authUser.user.email, other.full_name || '', job.job_title || 'Role', propertyName)
          }
        }
      }
    }

    await createNotification(candidate.user_id, 'general', `Congratulations - you have been hired`, `${propertyName} has completed your hire for ${job.job_title}. Your formal employment documents will follow directly from the employer.`, '/talent/hired')
    const { data: candidateAuth } = await admin.auth.admin.getUserById(candidate.user_id)
    const emailSent = candidateAuth.user?.email ? await sendHireConfirmation(candidateAuth.user.email, candidate.full_name || '', job.job_title || 'Role', propertyName) : false

    await createNotification(user.id, 'general', `Hire completed - ${candidate.full_name || 'Candidate'}`, `${job.job_title} has been closed and the successful placement archived.`, '/employer/applications')

    return NextResponse.json({ success:true, emailSent, otherApplicantsClosed:otherRows.length })
  } catch (error:any) {
    return NextResponse.json({ error:error?.message || 'Could not complete the hire.' }, { status:500 })
  }
}