import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

const RESTARTABLE_STATUSES = new Set(['withdrawn', 'rejected'])

async function resetPreviousJourney(admin: any, applicationId: string) {
  const [interviews, offers] = await Promise.all([
    admin.from('application_interviews').delete().eq('application_id', applicationId),
    admin.from('application_offers').delete().eq('application_id', applicationId),
  ])
  if (interviews.error) throw new Error(`Could not clear previous interviews: ${interviews.error.message}`)
  if (offers.error) throw new Error(`Could not clear previous offer: ${offers.error.message}`)
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('swipes')
    .select('target_id,action')
    .eq('swiper_id', user.id)
    .eq('swiper_type', 'candidate')
    .eq('target_type', 'job')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data || []
  const passedJobIds = Array.from(new Set(rows.filter((row: any) => row.action === 'left').map((row: any) => row.target_id)))
  const reviewedJobIds = Array.from(new Set(rows.filter((row: any) => row.action === 'right').map((row: any) => row.target_id)))
  return NextResponse.json({
    passed_job_ids: passedJobIds,
    reviewed_job_ids: reviewedJobIds,
    saved_job_ids: reviewedJobIds,
  })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const targetId = String(body.targetId || '')
  const action = String(body.action || '') as 'left' | 'right'
  if (!targetId || !['left', 'right'].includes(action)) return NextResponse.json({ error: 'Invalid swipe.' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: job }] = await Promise.all([
    admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('job_listings').select('*').eq('id', targetId).maybeSingle(),
  ])
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })

  let applicationId: string | null = null
  let matchScore: number | null = null

  if (action === 'right') {
    const match = calculateMatchScore(candidate, job)
    matchScore = Number(match.score || 0)

    const { data: existing } = await admin.from('applications')
      .select('id,status,cover_letter')
      .eq('candidate_id', candidate.id)
      .eq('role_id', targetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.status === 'draft') {
      applicationId = existing.id
      await admin.from('applications').update({ match_score: matchScore, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else if (existing && RESTARTABLE_STATUSES.has(String(existing.status || '').toLowerCase())) {
      applicationId = existing.id
      try {
        await resetPreviousJourney(admin, existing.id)
      } catch (cleanupError: any) {
        return NextResponse.json({ error: cleanupError?.message || 'Could not clear the previous recruitment journey.' }, { status: 500 })
      }
      const { error: restartError } = await admin.from('applications').update({
        status: 'draft',
        match_score: matchScore,
        cover_note: null,
        submitted_at: null,
        archived_at: null,
        hired_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
      if (restartError) return NextResponse.json({ error: 'Could not restart your application.' }, { status: 500 })
    } else if (existing) {
      applicationId = existing.id
    } else {
      const { data: created, error: createError } = await admin.from('applications').insert({
        candidate_id: candidate.id,
        role_id: targetId,
        job_id: targetId,
        status: 'draft',
        match_score: matchScore,
        cover_letter: '',
        submitted_at: null,
      }).select('id').single()
      if (createError) return NextResponse.json({ error: 'Could not start your application.' }, { status: 500 })
      applicationId = created?.id || null
    }
  }

  const row = {
    swiper_id: user.id,
    swiper_type: 'candidate',
    target_id: targetId,
    target_type: 'job',
    action,
    context_job_id: targetId,
  }
  const { error } = await admin.from('swipes').upsert(row, {
    onConflict: 'swiper_id,swiper_type,target_id,target_type,context_job_id',
    ignoreDuplicates: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, action, applicationDraft: action === 'right', applicationId, matchScore })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

  const { data: swipes, error: swipeReadError } = await admin
    .from('swipes')
    .select('target_id')
    .eq('swiper_id', user.id)
    .eq('swiper_type', 'candidate')
    .eq('target_type', 'job')

  if (swipeReadError) return NextResponse.json({ error: swipeReadError.message }, { status: 500 })
  const targetIds = Array.from(new Set((swipes || []).map((row: any) => row.target_id).filter(Boolean)))

  const { error: swipeDeleteError } = await admin
    .from('swipes')
    .delete()
    .eq('swiper_id', user.id)
    .eq('swiper_type', 'candidate')
    .eq('target_type', 'job')
  if (swipeDeleteError) return NextResponse.json({ error: swipeDeleteError.message }, { status: 500 })

  if (targetIds.length) {
    const { error: savedDeleteError } = await admin
      .from('saved_jobs')
      .delete()
      .eq('candidate_id', candidate.id)
      .in('job_id', targetIds)
    if (savedDeleteError) return NextResponse.json({ error: savedDeleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, reset_count: targetIds.length })
}
