import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: jobs } = await admin.from('job_listings').select('id,job_title,status,is_live').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map(job => job.id)
  if (!jobIds.length) return NextResponse.json({ items: [] })

  const { data: applications, error } = await admin.from('applications')
    .select('id,candidate_id,role_id,job_id,status,match_score,cover_note,cover_letter,created_at,updated_at,hired_at,archived_at')
    .in('role_id', jobIds)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load hired placements.' }, { status: 500 })

  const rows = applications || []
  const applicationIds = rows.map(row => row.id)
  const candidateIds = Array.from(new Set(rows.map(row => row.candidate_id).filter(Boolean))) as string[]

  const [{ data: candidates }, { data: interviews }, { data: offers }] = await Promise.all([
    candidateIds.length ? admin.from('candidate_profiles').select('id,user_id,full_name,headline,location,profile_image_url').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_interviews').select('*').in('application_id', applicationIds).order('round_number', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    applicationIds.length ? admin.from('application_offers').select('*').in('application_id', applicationIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.id, candidate]))
  const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
  const interviewMap = new Map<string, any[]>()
  for (const interview of interviews || []) interviewMap.set(interview.application_id, [...(interviewMap.get(interview.application_id) || []), interview])
  const offerMap = new Map((offers || []).map((offer: any) => [offer.application_id, offer]))

  return NextResponse.json({
    items: rows.map(row => ({
      ...row,
      candidate: candidateMap.get(row.candidate_id) || null,
      job: jobMap.get(row.role_id || row.job_id) || null,
      interviews: interviewMap.get(row.id) || [],
      offer: offerMap.get(row.id) || null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const applicationId = String(body.applicationId || '')
  const action = String(body.action || '')
  if (!applicationId || action !== 'reopen_record') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: application } = await admin.from('applications').select('id,role_id,job_id,status,archived_at').eq('id', applicationId).maybeSingle()
  if (!application?.archived_at) return NextResponse.json({ error: 'Archived placement not found.' }, { status: 404 })

  const jobId = application.role_id || application.job_id
  const { data: job } = await admin.from('job_listings').select('id,employer_id').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('applications').update({ archived_at: null, updated_at: new Date().toISOString() }).eq('id', application.id)
  if (error) return NextResponse.json({ error: 'Could not reopen placement record.' }, { status: 500 })

  return NextResponse.json({ success: true, note: 'Recruitment record reopened. The filled vacancy remains closed.' })
}
