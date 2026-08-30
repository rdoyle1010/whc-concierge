import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = account?.role === 'employer' ? 'employer' : 'talent'

  if (role === 'talent') {
    const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ role, items: [] })

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
      ? await admin.from('employer_profiles').select('id,user_id,company_name,property_name,logo_url,cover_image_url').in('id', employerIds)
      : { data: [] as any[] }
    const jobMap = new Map((jobs || []).map((job: any) => [job.id, job]))
    const employerMap = new Map((employers || []).map((employer: any) => [employer.id, employer]))
    const interviewMap = new Map<string, any[]>()
    for (const interview of interviews || []) interviewMap.set(interview.application_id, [...(interviewMap.get(interview.application_id) || []), interview])
    const offerMap = new Map((offers || []).map((offer: any) => [offer.application_id, offer]))

    return NextResponse.json({ role, items: rows.map(row => {
      const job: any = jobMap.get(row.role_id || row.job_id) || null
      return { ...row, job, employer: job ? employerMap.get(job.employer_id) || null : null, interviews: interviewMap.get(row.id) || [], offer: offerMap.get(row.id) || null }
    }) })
  }

  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ role, items: [] })
  const { data: jobs } = await admin.from('job_listings').select('id,job_title,status,is_live').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map(job => job.id)
  if (!jobIds.length) return NextResponse.json({ role, items: [] })

  const { data: applications, error } = await admin.from('applications')
    .select('id,candidate_id,role_id,job_id,status,match_score,cover_note,cover_letter,created_at,updated_at,hired_at,archived_at')
    .in('role_id', jobIds)
    .not('archived_at', 'is', null)
    .not('hired_at', 'is', null)
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

  return NextResponse.json({ role, items: rows.map(row => ({ ...row, candidate: candidateMap.get(row.candidate_id) || null, job: jobMap.get(row.role_id || row.job_id) || null, interviews: interviewMap.get(row.id) || [], offer: offerMap.get(row.id) || null })) })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const applicationId = String(body.applicationId || '')
  if (!applicationId || String(body.action || '') !== 'reopen_record') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (account?.role !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })
  const { data: application } = await admin.from('applications').select('id,role_id,job_id,archived_at').eq('id', applicationId).maybeSingle()
  if (!application?.archived_at) return NextResponse.json({ error: 'Archived placement not found.' }, { status: 404 })
  const jobId = application.role_id || application.job_id
  const { data: job } = await admin.from('job_listings').select('id,employer_id').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await admin.from('applications').update({ archived_at: null, updated_at: new Date().toISOString() }).eq('id', application.id)
  if (error) return NextResponse.json({ error: 'Could not reopen placement record.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
