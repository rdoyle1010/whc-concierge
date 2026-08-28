import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

const RESTARTABLE_STATUSES = new Set(['withdrawn', 'rejected'])

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
  const matchExplanation = match.hardStop
    ? [match.matchExplanation, match.hardStopReason].filter(Boolean).join(' ')
    : (match.matchExplanation || '')

  const { data: existing } = await admin.from('applications')
    .select('id,status,cover_letter')
    .eq('candidate_id', candidate.id)
    .eq('role_id', job.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && existing.status === 'draft') {
    const { error } = await admin.from('applications').update({ match_score: match.score, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'Could not refresh your application draft.' }, { status: 500 })
    return NextResponse.json({ success: true, applicationId: existing.id, draft: true, coverLetter: existing.cover_letter || '', matchScore: match.score, matchLabel: match.label, matchExplanation })
  }

  if (existing && RESTARTABLE_STATUSES.has(String(existing.status || '').toLowerCase())) {
    const { error } = await admin.from('applications').update({
      status: 'draft',
      match_score: match.score,
      cover_letter: existing.cover_letter || '',
      submitted_at: null,
      archived_at: null,
      hired_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: 'Could not restart your application.' }, { status: 500 })
    return NextResponse.json({ success: true, applicationId: existing.id, draft: true, restarted: true, coverLetter: existing.cover_letter || '', matchScore: match.score, matchLabel: match.label, matchExplanation })
  }

  if (existing) {
    return NextResponse.json({ error: 'You already have an active application for this role.', applicationId: existing.id }, { status: 409 })
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

  if (error) return NextResponse.json({ error: 'Could not start your application.' }, { status: 500 })
  return NextResponse.json({ success: true, applicationId: created.id, draft: true, coverLetter: '', matchScore: match.score, matchLabel: match.label, matchExplanation })
}
