import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

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
  return NextResponse.json({
    passed_job_ids: Array.from(new Set(rows.filter((row: any) => row.action === 'left').map((row: any) => row.target_id))),
    saved_job_ids: Array.from(new Set(rows.filter((row: any) => row.action === 'right').map((row: any) => row.target_id))),
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
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('job_listings').select('id,is_live,expires_at').eq('id', targetId).maybeSingle(),
  ])
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
  if (!job || !job.is_live || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })

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

  if (action === 'right') {
    await admin.from('saved_jobs').upsert({ candidate_id: candidate.id, job_id: targetId }, { onConflict: 'candidate_id,job_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ success: true, action })
}
