import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rankCandidates } from '@/lib/matching'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const supabase = createAdminClient()

    // Get job listing
    const { data: job, error: jobError } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Get approved candidates
    const { data: candidates } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('approval_status', 'approved')

    if (!candidates) return NextResponse.json({ results: [] })

    // Exclude candidates who have blocked this employer
    const employerId = job.employer_id || job.employer_profile_id
    let blockedCandidateIds: string[] = []
    if (employerId) {
      const { data: blocks } = await supabase
        .from('profile_blocks')
        .select('candidate_id')
        .eq('blocked_employer_id', employerId)
      blockedCandidateIds = (blocks || []).map((b: any) => b.candidate_id)
    }

    const filtered = candidates.filter(c => !blockedCandidateIds.includes(c.id))
    const results = rankCandidates(filtered, job)

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
