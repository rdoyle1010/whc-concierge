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

  const { data: applications, error } = await admin.from('applications')
    .select('id,candidate_id,role_id,job_id,status,match_score,cover_note,cover_letter,created_at,updated_at,hired_at,archived_at')
    .eq('candidate_id', candidate.id)
    .not('archived_at', 'is', null)
    .not('hired_at', 'is', null)
    .order('archived_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load completed placements.' }, { status: 500 })

  const rows = applications || []
  const applicationIds = rows.map(row => row.id)
  const jobIds = Array.from(new Set(rows.map(row => row.role_id || row.job_id).filter(Boolean))) as string[]

  const [{ data: jobs }, { data: interviews }, { data: offers }] = await Promise.all([
    jobIds.length ? admin.from('job_listings').select('id,job_title,location,employer_id').in('id', jobIds) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_interviews').select('*').in('application_id', applicationIds).order('round_number', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_offers').select('*').in('application_id', applicationIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const employerIds = Array.from(new Set((jobs || []).map((job: any) => job.employer_id).filter(Boolean))) as string[]
  const { data: employers } = employerIds.length
    ? await admin.from('employer_profiles').select('id,user_id,company_name,property_name').in('id', employerIds)
    : { data: [] as any[] }

  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const employerMap = new Map((employers || []).map((employer: any) => [employer.id, employer]))
  const interviewMap = new Map<string, any[]>()
  for (const interview of interviews || []) interviewMap.set(interview.application_id, [...(interviewMap.get(interview.application_id) || []), interview])
  const offerMap = new Map((offers || []).map((offer: any) => [offer.application_id, offer]))

  return NextResponse.json({
    items: rows.map(row => {
      const job: any = jobMap.get(row.role_id || row.job_id) || null
      return {
        ...row,
        job,
        employer: job ? employerMap.get(job.employer_id) || null : null,
        interviews: interviewMap.get(row.id) || [],
        offer: offerMap.get(row.id) || null,
      }
    }),
  })
}
