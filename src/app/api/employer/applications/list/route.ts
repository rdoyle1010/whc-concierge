import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: jobs } = await admin.from('job_listings').select('id,job_title,location').eq('employer_id', employer.id)
  const jobIds = (jobs || []).map((j:any)=>j.id)
  if (!jobIds.length) return NextResponse.json({ items: [] })

  const { data: applications, error } = await admin.from('applications')
    .select('id,status,match_score,candidate_id,role_id,job_id,created_at,submitted_at,archived_at,hired_at')
    .in('role_id', jobIds)
    .neq('status','draft')
    .is('archived_at', null)
    .order('submitted_at', { ascending: false, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const candidateIds = Array.from(new Set((applications || []).map((a:any)=>a.candidate_id).filter(Boolean)))
  const { data: candidates } = candidateIds.length
    ? await admin.from('candidate_profiles').select('id,full_name,headline,role_level,location,profile_image_url').in('id', candidateIds)
    : { data: [] as any[] }

  const candidateMap = new Map((candidates || []).map((c:any)=>[c.id,c]))
  const jobMap = new Map((jobs || []).map((j:any)=>[j.id,j]))

  return NextResponse.json({
    items: (applications || []).map((a:any)=>({
      ...a,
      candidate: candidateMap.get(a.candidate_id) || null,
      job: jobMap.get(a.role_id || a.job_id) || null,
    }))
  })
}
