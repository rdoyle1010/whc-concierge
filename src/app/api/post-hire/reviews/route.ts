import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function hasReview(admin: ReturnType<typeof createAdminClient>, reviewerId: string, reviewedId: string) {
  for (const column of ['reviewed_id', 'reviewee_id']) {
    const { data, error } = await admin.from('reviews').select('id').eq('reviewer_id', reviewerId).eq(column, reviewedId).limit(1).maybeSingle()
    if (!error && data) return true
  }
  return false
}

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id,user_id,full_name').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id,user_id,company_name,property_name').eq('user_id', user.id).maybeSingle(),
  ])

  let role: 'talent' | 'employer' | null = candidate ? 'talent' : employer ? 'employer' : null
  if (!role) return NextResponse.json({ role: null, placements: [] })

  let applications: any[] = []
  if (role === 'talent' && candidate) {
    const { data } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status,hired_at,archived_at').eq('candidate_id', candidate.id).eq('status', 'accepted').not('hired_at', 'is', null).order('hired_at', { ascending: false })
    applications = data || []
  } else if (employer) {
    const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employer.id)
    const jobIds = (jobs || []).map(job => job.id)
    if (jobIds.length) {
      const { data } = await admin.from('applications').select('id,candidate_id,role_id,job_id,status,hired_at,archived_at').in('role_id', jobIds).eq('status', 'accepted').not('hired_at', 'is', null).order('hired_at', { ascending: false })
      applications = data || []
    }
  }

  const jobIds = Array.from(new Set(applications.map(app => app.role_id || app.job_id).filter(Boolean))) as string[]
  const candidateIds = Array.from(new Set(applications.map(app => app.candidate_id).filter(Boolean))) as string[]
  const [{ data: jobs }, { data: candidates }] = await Promise.all([
    jobIds.length ? admin.from('job_listings').select('id,job_title,employer_id').in('id', jobIds) : Promise.resolve({ data: [] as any[] }),
    candidateIds.length ? admin.from('candidate_profiles').select('id,user_id,full_name').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
  ])
  const employerIds = Array.from(new Set((jobs || []).map((job: any) => job.employer_id).filter(Boolean))) as string[]
  const { data: employers } = employerIds.length ? await admin.from('employer_profiles').select('id,user_id,company_name,property_name').in('id', employerIds) : { data: [] as any[] }

  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const candidateMap = new Map((candidates || []).map((row: any) => [row.id, row]))
  const employerMap = new Map((employers || []).map((row: any) => [row.id, row]))

  const placements = []
  for (const application of applications) {
    const job = jobMap.get(application.role_id || application.job_id)
    const placementCandidate = candidateMap.get(application.candidate_id)
    const placementEmployer = job ? employerMap.get(job.employer_id) : null
    const counterpart = role === 'talent' ? placementEmployer : placementCandidate
    if (!counterpart?.user_id) continue
    const counterpartReviewed = await hasReview(admin, user.id, counterpart.user_id)
    const { data: platformReview } = await admin.from('platform_experience_reviews').select('id').eq('application_id', application.id).eq('reviewer_user_id', user.id).maybeSingle()
    placements.push({
      applicationId: application.id,
      jobTitle: job?.job_title || 'Role',
      hiredAt: application.hired_at,
      counterpartUserId: counterpart.user_id,
      counterpartName: role === 'talent' ? (counterpart.property_name || counterpart.company_name || 'the property') : (counterpart.full_name || 'the professional'),
      counterpartReviewType: role === 'talent' ? 'employer' : 'candidate',
      counterpartReviewed,
      platformReviewed: Boolean(platformReview),
    })
  }

  return NextResponse.json({ role, placements })
}
