import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: jobs } = await admin.from('job_listings').select('*').eq('employer_id', employer.id)
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
    ? await admin.from('candidate_profiles').select('*').in('id', candidateIds)
    : { data: [] as any[] }

  const candidateMap = new Map((candidates || []).map((c:any)=>[c.id,c]))
  const jobMap = new Map((jobs || []).map((j:any)=>[j.id,j]))

  const items = [] as any[]
  for (const application of applications || []) {
    const candidate:any = candidateMap.get(application.candidate_id) || null
    const job:any = jobMap.get(application.role_id || application.job_id) || null
    let score = Number(application.match_score || 0)
    let explanation = ''
    let label = ''
    if (candidate && job) {
      const live = calculateMatchScore(candidate, job)
      if (!live.hardStop) {
        score = Number(live.score || 0)
        explanation = String(live.matchExplanation || '')
        label = String(live.label || '')
        if (score !== Number(application.match_score || 0)) {
          await admin.from('applications').update({ match_score: score, updated_at: new Date().toISOString() }).eq('id', application.id)
        }
      }
    }
    items.push({
      ...application,
      match_score: score,
      match_label: label,
      match_explanation: explanation,
      candidate: candidate ? {
        id: candidate.id,
        full_name: candidate.full_name,
        headline: candidate.headline,
        role_level: candidate.role_level,
        location: candidate.location,
        profile_image_url: candidate.profile_image_url,
      } : null,
      job: job ? { id: job.id, job_title: job.job_title, location: job.location } : null,
    })
  }

  return NextResponse.json({ items })
}
