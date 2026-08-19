import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRequest } from '@/lib/admin-api-auth'

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: reviews, error } = await admin
    .from('platform_experience_reviews')
    .select('id,application_id,reviewer_user_id,reviewer_role,rating,comment,created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = reviews || []
  const applicationIds = Array.from(new Set(rows.map(row => row.application_id).filter(Boolean))) as string[]
  const reviewerIds = Array.from(new Set(rows.map(row => row.reviewer_user_id).filter(Boolean))) as string[]

  const [{ data: applications }, { data: candidates }, { data: employers }] = await Promise.all([
    applicationIds.length
      ? admin.from('applications').select('id,role_id,job_id,candidate_id,hired_at,archived_at').in('id', applicationIds)
      : Promise.resolve({ data: [] as any[] }),
    reviewerIds.length
      ? admin.from('candidate_profiles').select('user_id,full_name').in('user_id', reviewerIds)
      : Promise.resolve({ data: [] as any[] }),
    reviewerIds.length
      ? admin.from('employer_profiles').select('user_id,company_name,property_name').in('user_id', reviewerIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const jobIds = Array.from(new Set((applications || []).map((application: any) => application.role_id || application.job_id).filter(Boolean))) as string[]
  const { data: jobs } = jobIds.length
    ? await admin.from('job_listings').select('id,job_title').in('id', jobIds)
    : { data: [] as any[] }

  const applicationMap = new Map((applications || []).map((application: any) => [application.id, application]))
  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const talentMap = new Map((candidates || []).map((candidate: any) => [candidate.user_id, candidate.full_name]))
  const employerMap = new Map((employers || []).map((employer: any) => [employer.user_id, employer.property_name || employer.company_name]))

  const items = rows.map(row => {
    const application: any = applicationMap.get(row.application_id)
    const job: any = application ? jobMap.get(application.role_id || application.job_id) : null
    const reviewerName = row.reviewer_role === 'talent'
      ? talentMap.get(row.reviewer_user_id)
      : employerMap.get(row.reviewer_user_id)
    return {
      ...row,
      reviewer_name: reviewerName || (row.reviewer_role === 'talent' ? 'Talent member' : 'Property'),
      job_title: job?.job_title || 'Completed placement',
      hired_at: application?.hired_at || null,
    }
  })

  const average = items.length ? items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length : 0
  return NextResponse.json({ items, total: items.length, average })
}
