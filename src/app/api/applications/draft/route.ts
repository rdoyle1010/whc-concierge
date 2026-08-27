import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

const MIN_APPLICATION_MATCH = 45

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId } = await req.json()
  if (!jobId) return NextResponse.json({ error: 'Role is required' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: job }] = await Promise.all([
    admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('job_listings').select('*').eq('id', jobId).maybeSingle(),
  ])

  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) {
    return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })
  }

  const match = calculateMatchScore(candidate, job)
  if (match.hardStop) return NextResponse.json({ error: match.hardStopReason || 'This role is not compatible with your profile.' }, { status: 400 })
  if (match.score < MIN_APPLICATION_MATCH) {
    return NextResponse.json({
      error: `This role is currently a ${match.score}% match. Applications open from ${MIN_APPLICATION_MATCH}% once mandatory requirements are met.`,
      matchScore: match.score,
      minimumMatch: MIN_APPLICATION_MATCH,
      matchExplanation: match.matchExplanation || '',
    }, { status: 400 })
  }

  const { data: existing } = await admin.from('applications')
    .select('id,status,cover_letter')
    .eq('candidate_id', candidate.id)
    .eq('role_id', job.id)
    .maybeSingle()

  if (existing && existing.status !== 'draft') {
    return NextResponse.json({ error: 'You already have an application for this role.', applicationId: existing.id }, { status: 409 })
  }

  if (existing) {
    const { error } = await admin.from('applications').update({ match_score: match.score, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'Could not save this role to Ready to Send.' }, { status: 500 })
    return NextResponse.json({ success: true, applicationId: existing.id, draft: true, coverLetter: existing.cover_letter || '', matchScore: match.score, matchLabel: match.label, matchExplanation: match.matchExplanation || '' })
  }

  const { data: created, error } = await admin.from('applications').insert({
    candidate_id: candidate.id,
    role_id: job.id,
    job_id: job.id,
    status: 'draft',
    match_score: match.score,
    cover_letter: '',
    submitted_at: null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Could not save this role to Ready to Send.' }, { status: 500 })
  return NextResponse.json({ success: true, applicationId: created.id, draft: true, coverLetter: '', matchScore: match.score, matchLabel: match.label, matchExplanation: match.matchExplanation || '' })
}
