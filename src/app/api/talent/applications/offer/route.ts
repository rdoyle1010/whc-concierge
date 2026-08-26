import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { getRequestUser } from '@/lib/request-user'

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
      const { data: employer } = await admin.from('employer_profiles').select('user_id').eq('id', job.employer_id).maybeSingle()
      if (employer?.user_id) {
        await createNotification(employer.user_id, 'general', action === 'accept' ? `Offer accepted - ${job.job_title}` : `Offer declined - ${job.job_title}`, `${candidate.full_name || 'The candidate'} has ${action === 'accept' ? 'accepted' : 'declined'} the offer.`, '/employer/applications')
      }
    }
    return NextResponse.json({ success: true, offer, applicationStatus: nextApplicationStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not respond to the offer.' }, { status: 500 })
  }
}
