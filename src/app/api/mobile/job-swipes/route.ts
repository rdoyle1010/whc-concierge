import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { createNotification } from '@/lib/notifications'
import { createMutualMatch } from '@/lib/mutual-match'

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

  // A right swipe is interest only, exactly as on the website. Applications
  // are created exclusively through the deliberate Apply → Review & Send
  // journey (/api/applications/draft + /api/applications/submit).
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

  if (action === 'left') return NextResponse.json({ success: true, action, matched: false })

  // Mirror the web swipe route: notify the employer, and if they have already
  // said yes to this candidate for this role, create the mutual match.
  let matched = false
  const { data: employer } = await admin.from('employer_profiles').select('*').eq('id', job.employer_id).maybeSingle()
  if (employer?.user_id) {
    const match = calculateMatchScore(candidate, job)
    await createNotification(
      employer.user_id,
      'general',
      'A professional is interested in your role',
      `${candidate.full_name || 'A professional'} is interested in ${job.job_title}.`,
      `/employer/candidates?candidate=${candidate.id}`,
    )
    const { data: employerYes } = await admin.from('swipes').select('id')
      .eq('swiper_id', employer.user_id)
      .eq('swiper_type', 'employer')
      .eq('target_id', candidate.id)
      .eq('target_type', 'candidate')
      .eq('action', 'right')
      .eq('context_job_id', job.id)
      .maybeSingle()
    if (employerYes) {
      let employerEmail = employer.contact_email || null
      if (!employerEmail) {
        const { data: employerUser } = await admin.auth.admin.getUserById(employer.user_id)
        employerEmail = employerUser?.user?.email || null
      }
      try {
        await createMutualMatch(admin, {
          candidate, employer, job, score: Number(match.score || 0),
          candidateUserId: user.id, employerUserId: employer.user_id,
          candidateEmail: user.email, employerEmail,
        })
        matched = true
      } catch (matchError: any) {
        console.error('Mobile talent mutual match failed:', matchError?.message)
      }
    }
  }

  return NextResponse.json({ success: true, action, matched })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  // Resetting the swipe deck clears swipe decisions ONLY. Saved roles are an
  // independent feature and must never be wiped by a deck reset.
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

  return NextResponse.json({ success: true, reset_count: targetIds.length })
}
