import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

  const { data: applications } = await admin.from('applications')
    .select('id,role_id,job_id,status,match_score,updated_at,archived_at')
    .eq('candidate_id', candidate.id)
    .is('archived_at', null)
    // A completed hire belongs on the Hired page, not among active
    // applications - even if the employer has cleared their own archive flag.
    .is('hired_at', null)
    .in('status', ['shortlisted','interview','offered','accepted'])
    .order('updated_at', { ascending: false })

  const rows = applications || []
  const applicationIds = rows.map(row => row.id)
  const jobIds = Array.from(new Set(rows.map(row => row.role_id || row.job_id).filter(Boolean)))
  const [{ data: jobs }, { data: interviews }, { data: offers }] = await Promise.all([
    jobIds.length ? admin.from('job_listings').select('id,job_title,employer_id').in('id', jobIds) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_interviews').select('*').in('application_id', applicationIds).order('round_number', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_offers').select('*').in('application_id', applicationIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const employerIds = Array.from(new Set((jobs || []).map((job: any) => job.employer_id).filter(Boolean)))
  const { data: employers } = employerIds.length
    ? await admin.from('employer_profiles').select('id,user_id,company_name,property_name').in('id', employerIds)
    : { data: [] as any[] }

  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const employerMap = new Map((employers || []).map((employer: any) => [employer.id, employer]))
  const interviewMap = new Map<string, any[]>()
  for (const interview of interviews || []) interviewMap.set(interview.application_id, [...(interviewMap.get(interview.application_id) || []), interview])
  const offerMap = new Map((offers || []).map((offer: any) => [offer.application_id, offer]))

  return NextResponse.json({ items: rows.map(row => {
    const job: any = jobMap.get(row.role_id || row.job_id) || null
    return {
      ...row,
      job,
      employer: job ? employerMap.get(job.employer_id) || null : null,
      interviews: interviewMap.get(row.id) || [],
      offer: offerMap.get(row.id) || null,
    }
  }) })
}
