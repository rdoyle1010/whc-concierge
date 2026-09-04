import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/request-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { trackEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { applicationId } = await req.json()
  if (!applicationId) return NextResponse.json({ error: 'Application is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

  const { data: application } = await admin.from('applications').select('id, candidate_id, status, role_id, job_id').eq('id', applicationId).maybeSingle()
  if (!application || application.candidate_id !== candidate.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (['accepted', 'rejected'].includes(application.status)) return NextResponse.json({ error: 'This application can no longer be withdrawn' }, { status: 409 })

  // A draft was never sent - deleting it is genuinely just tidying up.
  if (application.status === 'draft') {
    const { error } = await admin.from('applications').delete().eq('id', applicationId).eq('candidate_id', candidate.id)
    if (error) return NextResponse.json({ error: 'Could not withdraw application' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // A submitted application is a real recruitment record: mark it withdrawn and
  // archived (rather than deleting it) and tell the employer, so candidates do
  // not silently vanish from a live pipeline.
  const now = new Date().toISOString()
  const { error } = await admin.from('applications')
    .update({ status: 'withdrawn', archived_at: now, updated_at: now })
    .eq('id', applicationId).eq('candidate_id', candidate.id)
  if (error) return NextResponse.json({ error: 'Could not withdraw application' }, { status: 500 })

  const jobId = application.role_id || application.job_id
  if (jobId) {
    const { data: job } = await admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle()
    if (job?.employer_id) {
      const { data: candidateProfile } = await admin.from('candidate_profiles').select('full_name').eq('id', candidate.id).maybeSingle()
      const { data: employer } = await admin.from('employer_profiles').select('user_id').eq('id', job.employer_id).maybeSingle()
      if (employer?.user_id) {
        await createNotification(employer.user_id, 'general', `Application withdrawn - ${job.job_title}`, `${candidateProfile?.full_name || 'A candidate'} has withdrawn their application for ${job.job_title}.`, '/employer/applications')
      }
    }
  }
  await trackEvent('application_withdrawn', { actorUserId: user.id, candidateId: candidate.id, jobId: jobId, applicationId: application.id })
  return NextResponse.json({ success: true })
}
