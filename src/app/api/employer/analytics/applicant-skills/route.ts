import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// The five skills that come up most often across this employer's applicants.
//
// This used to be worked out in the browser, which meant the page fetched
// `candidate_profiles.*` for every applicant and threw all of it away except
// two array columns. Phone numbers, postcodes, document paths and Stripe
// identifiers were all in that response, one devtools tab away, to render a
// list of five words.
//
// Now the counting happens on the server and only the five words are sent.
// The employer's ownership of the roles is checked first, so the count can
// only ever cover their own applicants.
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id, approval_status').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'An employer account is required' }, { status: 403 })

    const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employer.id)
    const jobIds = (jobs || []).map((job: any) => job.id)
    if (jobIds.length === 0) return NextResponse.json({ skills: [] })

    const { data: applications } = await admin.from('applications')
      .select('candidate_id')
      .in('role_id', jobIds)
      .neq('status', 'draft')
    const candidateIds = Array.from(new Set((applications || []).map((row: any) => row.candidate_id).filter(Boolean)))
    if (candidateIds.length === 0) return NextResponse.json({ skills: [] })

    // Two columns, and only for people who applied to this employer.
    const { data: candidates } = await admin.from('candidate_profiles')
      .select('id, services_offered, treatment_skills')
      .in('id', candidateIds)

    const counts = new Map<string, number>()
    for (const candidate of candidates || []) {
      const skills: string[] = (candidate.services_offered && candidate.services_offered.length)
        ? candidate.services_offered
        : (candidate.treatment_skills || [])
      for (const skill of skills) {
        if (!skill) continue
        counts.set(skill, (counts.get(skill) || 0) + 1)
      }
    }

    const skills = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill)

    return NextResponse.json({ skills })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Applicant skills are unavailable.' }, { status: 500 })
  }
}
