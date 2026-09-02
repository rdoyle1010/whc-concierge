import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getRequestUser } from '@/lib/request-user'
import { trackEvent } from '@/lib/analytics'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

async function sendOfferResponseEmail(to: string, subject: string, bodyHtml: string) {
  if (!RESEND_API_KEY || !to) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: bodyHtml }),
    })
    if (!response.ok) console.error('Offer response email failed:', response.status)
    return response.ok
  } catch (error: any) {
    console.error('Offer response email failed:', error?.message)
    return false
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const action = String(body.action || '')
    const note = String(body.note || '').trim().slice(0, 2000)
    if (!applicationId || !['accept','decline'].includes(action)) return NextResponse.json({ error: 'Invalid offer response.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
    const { data: application } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status').eq('id', applicationId).maybeSingle()
    if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (application.status !== 'offered') return NextResponse.json({ error: 'There is no active offer to respond to.' }, { status: 409 })

    const nextOfferStatus = action === 'accept' ? 'accepted' : 'declined'
    const { data: offer, error } = await admin.from('application_offers').update({
      status: nextOfferStatus,
      candidate_note: note || null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('application_id', application.id).eq('status', 'offered').select('*').maybeSingle()
    if (error || !offer) return NextResponse.json({ error: 'Could not update the offer.' }, { status: 409 })

    const nextApplicationStatus = action === 'accept' ? 'accepted' : 'rejected'
    await admin.from('applications').update({ status: nextApplicationStatus, updated_at: new Date().toISOString() }).eq('id', application.id)

    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (job?.employer_id) {
      const { data: employer } = await admin.from('employer_profiles').select('user_id,contact_email').eq('id', job.employer_id).maybeSingle()
      if (employer?.user_id) {
        await createNotification(employer.user_id, 'general', action === 'accept' ? `Offer accepted - ${job.job_title}` : `Offer declined - ${job.job_title}`, `${candidate.full_name || 'The candidate'} has ${action === 'accept' ? 'accepted' : 'declined'} the offer.`, '/employer/applications')
        // A signed acceptance (or a decline) is too important to rely on the
        // in-app bell alone - email the employer as well.
        let employerEmail = employer.contact_email || null
        if (!employerEmail) {
          const { data: employerUser } = await admin.auth.admin.getUserById(employer.user_id)
          employerEmail = employerUser?.user?.email || null
        }
        if (employerEmail) {
          const verb = action === 'accept' ? 'accepted' : 'declined'
          await sendOfferResponseEmail(
            employerEmail,
            `Offer ${verb} - ${job.job_title}`,
            `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1b1a"><h2 style="font-weight:600">Offer ${verb}</h2><p style="line-height:1.6"><strong>${(candidate.full_name || 'The candidate').replace(/</g,'&lt;')}</strong> has ${verb} your offer for <strong>${(job.job_title || 'the role').replace(/</g,'&lt;')}</strong>.${note ? `</p><div style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;margin:20px 0;line-height:1.6;white-space:pre-wrap">${note.replace(/</g,'&lt;')}</div><p style="line-height:1.6">` : ' '}Sign in to take the next step.</p><p style="margin:28px 0"><a href="https://talenthousecollective.co.uk/employer/applications" style="background:#1c1b1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Open applications</a></p><p style="color:#777;font-size:13px">Wellness House Collective</p></div>`,
          )
        }
      }
    }
    await trackEvent(action === 'accept' ? 'offer_accepted' : 'offer_declined', { actorUserId: user.id, candidateId: candidate.id, jobId: job?.id, applicationId: application.id })
    return NextResponse.json({ success: true, offer, applicationStatus: nextApplicationStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not respond to the offer.' }, { status: 500 })
  }
}
