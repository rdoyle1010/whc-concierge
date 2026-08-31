import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

// Batch match scores for the Browse Roles list: a signed-in professional
// sends the job ids on screen and gets back their personal match percentage
// for each. The full breakdown lives on the role page (via /api/talent/job-match);
// this endpoint only powers the quiet percentage at the row's edge.

const MAX_JOB_IDS = 40

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    let body: any = null
    try { body = await req.json() } catch { body = null }
    const jobIds = Array.isArray(body?.jobIds)
      ? [...new Set(body.jobIds.filter((id: any) => typeof id === 'string' && id.trim()).map((id: string) => id.trim()))].slice(0, MAX_JOB_IDS)
      : []
    if (!jobIds.length) return NextResponse.json({ scores: {} })

    const admin = createAdminClient()
    const { data: candidate } = await admin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    // Not a candidate (an employer, say): no scores, quietly.
    if (!candidate) return NextResponse.json({ scores: {} })

    const { data: jobs } = await admin
      .from('job_listings')
      .select('*')
      .in('id', jobIds)
      .eq('is_live', true)

    const scores: Record<string, number> = {}
    for (const job of jobs || []) {
      try {
        scores[job.id] = calculateMatchScore(candidate, job).score
      } catch { /* one bad row never blanks the rest */ }
    }
    return NextResponse.json({ scores })
  } catch (e: any) {
    console.error('Job scores failed:', e?.message)
    return NextResponse.json({ error: 'Unable to calculate match scores right now.' }, { status: 500 })
  }
}
