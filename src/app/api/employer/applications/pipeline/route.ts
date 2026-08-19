import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: jobs } = await admin.from('job_listings').select('id,job_title').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map(job => job.id)
  if (!jobIds.length) return NextResponse.json({ items: [] })

  const { data: applications } = await admin.from('applications')
    .select('id,candidate_id,role_id,job_id,status,match_score,updated_at')
    .in('role_id', jobIds)
    .in('status', ['shortlisted','interview','offered','accepted'])
    .order('updated_at', { ascending: false })

  const rows = applications || []
  const applicationIds = rows.map(row => row.id)
  const candidateIds = Array.from(new Set(rows.map(row => row.candidate_id).filter(Boolean)))
  const [{ data: candidates }, { data: interviews }, { data: offers }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,full_name,headline').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_interviews').select('*').in('application_id', applicationIds).order('round_number', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_offers').select('*').in('application_id', applicationIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.id, candidate]))
  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const interviewMap = new Map<string, any[]>()
  for (const interview of interviews || []) interviewMap.set(interview.application_id, [...(interviewMap.get(interview.application_id) || []), interview])
  const offerMap = new Map((offers || []).map((offer: any) => [offer.application_id, offer]))

  return NextResponse.json({ items: rows.map(row => ({
    ...row,
    candidate: candidateMap.get(row.candidate_id) || null,
    job: jobMap.get(row.role_id || row.job_id) || null,
    interviews: interviewMap.get(row.id) || [],
    offer: offerMap.get(row.id) || null,
  })) })
}
