import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rankCandidates } from '@/lib/matching'

// Returns ranked candidate matches for a job. This exposes candidate PII,
// so it requires an authenticated caller who either owns the job's employer
// profile or is an admin.

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function POST(req: NextRequest) {
  try {
    // -- Auth: caller must be logged in --
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

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

    // -- Ownership: caller must own this job's employer profile, or be admin --
    const employerId = job.employer_id || job.employer_profile_id
    const [{ data: emp }, { data: prof }] = await Promise.all([
      supabase.from('employer_profiles').select('id, user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])
    const ownsJob = !!emp && !!employerId && emp.id === employerId
    const isAdmin = prof?.role === 'admin'
    if (!ownsJob && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get approved candidates
    const { data: candidates } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('approval_status', 'approved')

    if (!candidates) return NextResponse.json({ results: [] })

    // Exclude candidates who have blocked this employer
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
