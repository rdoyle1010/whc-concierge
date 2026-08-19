import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function resolveCompletedPlacement(admin: ReturnType<typeof createAdminClient>, applicationId: string, userId: string) {
  const { data: application } = await admin
    .from('applications')
    .select('id,candidate_id,role_id,job_id,status,hired_at,archived_at')
    .eq('id', applicationId)
    .maybeSingle()
  if (!application || application.status !== 'accepted' || !application.hired_at) return null

  const jobId = application.role_id || application.job_id
  const [{ data: candidate }, { data: job }] = await Promise.all([
    admin.from('candidate_profiles').select('id,user_id').eq('id', application.candidate_id).maybeSingle(),
    admin.from('job_listings').select('id,employer_id').eq('id', jobId).maybeSingle(),
  ])
  if (!candidate?.user_id || !job?.employer_id) return null

  const { data: employer } = await admin.from('employer_profiles').select('id,user_id').eq('id', job.employer_id).maybeSingle()
  if (!employer?.user_id) return null

  const reviewerRole = candidate.user_id === userId ? 'talent' : employer.user_id === userId ? 'employer' : null
  if (!reviewerRole) return null

  return { application, reviewerRole }
}

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const applicationId = req.nextUrl.searchParams.get('applicationId') || ''
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })

  const admin = createAdminClient()
  const placement = await resolveCompletedPlacement(admin, applicationId, user.id)
  if (!placement) return NextResponse.json({ eligible: false, reviewed: false })

  const { data: review } = await admin
    .from('platform_experience_reviews')
    .select('id,rating,comment,created_at')
    .eq('application_id', applicationId)
    .eq('reviewer_user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ eligible: true, reviewed: Boolean(review), review: review || null })
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const applicationId = String(body.applicationId || '')
  const rating = Number(body.rating)
  const comment = String(body.comment || '').trim().slice(0, 1000)

  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 })

  const admin = createAdminClient()
  const placement = await resolveCompletedPlacement(admin, applicationId, user.id)
  if (!placement) return NextResponse.json({ error: 'Platform reviews unlock after a completed hire.' }, { status: 403 })

  const { error } = await admin.from('platform_experience_reviews').insert({
    application_id: applicationId,
    reviewer_user_id: user.id,
    reviewer_role: placement.reviewerRole,
    rating,
    comment: comment || null,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You have already reviewed this placement.' }, { status: 409 })
    console.error('Platform experience review insert failed:', error.message)
    return NextResponse.json({ error: 'Could not save your review.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
