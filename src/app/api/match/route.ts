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

    const results = rankCandidates(candidates, job)

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
