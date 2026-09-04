import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// The signed-in employer's brief - what needs their attention today, computed
// from live data only. Sections with nothing to report come back empty (zero)
// and the client omits them. Each section is defensive: a failed query empties
// that section rather than the whole brief.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,property_name,company_name,approval_status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
    if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved first.' }, { status: 403 })

    const now = new Date()
    const nowIso = now.toISOString()
    const fortnightAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const today = nowIso.slice(0, 10)

    const [jobsRes, blocksRes, newCandidatesRes, expiredShiftsRes, urgentOverdueRes, countersRes] = await Promise.all([
      admin.from('job_listings').select('id,job_title,is_live,posted_date,expires_at').eq('employer_id', employer.id),
      admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employer.id),
      admin.from('candidate_profiles').select('id')
        .eq('approval_status', 'approved')
        .or('profile_visible.eq.true,profile_visible.is.null')
        // Counting somebody in "talent available near you" who has hidden
        // themselves is a small leak and a wrong number at once: it promises
        // a property reach it does not have.
        .or('stealth_mode.eq.false,stealth_mode.is.null')
        .gte('created_at', fortnightAgo),
      // Unfilled agency cover, honestly counted: cascades that expired without
      // acceptance, for shifts that have not yet passed.
      admin.from('agency_bookings').select('id', { count: 'exact', head: true })
        .eq('employer_id', employer.id)
        .eq('status', 'expired')
        .gte('shift_date', today),
      // Plus urgent requests still open but past their cascade deadline.
      admin.from('agency_bookings').select('id', { count: 'exact', head: true })
        .eq('employer_id', employer.id)
        .eq('urgent', true)
        .in('status', ['pending', 'countered'])
        .lt('cascade_deadline', nowIso)
        .gte('shift_date', today),
      admin.from('agency_bookings').select('id', { count: 'exact', head: true })
        .eq('employer_id', employer.id)
        .eq('status', 'countered'),
    ])

    const jobs = (jobsRes.data as any[]) || []
    const jobIds = jobs.map(job => job.id)

    // Applications on this employer's jobs. Rows link via role_id (the current
    // convention) with job_id as the legacy column, so match on either.
    let applications: any[] = []
    if (jobIds.length) {
      const idList = jobIds.join(',')
      const { data } = await admin.from('applications')
        .select('id,role_id,job_id,status')
        .or(`role_id.in.(${idList}),job_id.in.(${idList})`)
        .is('archived_at', null)
        .neq('status', 'draft')
      applications = data || []
    }

    // Section 1: newly approved, visible candidates this fortnight, minus any
    // who have blocked this employer.
    let newCandidates = 0
    try {
      const blocked = new Set(((blocksRes.data as any[]) || []).map(row => row.candidate_id))
      newCandidates = (((newCandidatesRes.data as any[]) || [])).filter(row => !blocked.has(row.id)).length
    } catch { newCandidates = 0 }

    // Section 2: applicants awaiting review, with a per-role breakdown.
    let applicantsAwaitingReview: { count: number; byJob: { jobTitle: string; count: number }[] } = { count: 0, byJob: [] }
    try {
      const pending = applications.filter(app => app.status === 'pending')
      const byJobId = new Map<string, number>()
      for (const app of pending) {
        const jobId = app.role_id || app.job_id
        if (!jobId) continue
        byJobId.set(jobId, (byJobId.get(jobId) || 0) + 1)
      }
      const byJob = Array.from(byJobId.entries())
        .map(([jobId, count]) => ({ jobTitle: jobs.find(job => job.id === jobId)?.job_title || 'Role', count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
      applicantsAwaitingReview = { count: pending.length, byJob }
    } catch { applicantsAwaitingReview = { count: 0, byJob: [] } }

    // Section 3: live roles posted over a week ago with no applications yet.
    // No invented benchmark - just the roles that have attracted nothing.
    let rolesWithNoApplications: { count: number; titles: string[] } = { count: 0, titles: [] }
    try {
      const appliedJobIds = new Set(applications.map(app => app.role_id || app.job_id).filter(Boolean))
      const weekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000
      const quiet = jobs.filter(job =>
        job.is_live &&
        job.posted_date && new Date(job.posted_date).getTime() < weekAgoMs &&
        (!job.expires_at || new Date(job.expires_at).getTime() > now.getTime()) &&
        !appliedJobIds.has(job.id))
      rolesWithNoApplications = { count: quiet.length, titles: quiet.slice(0, 3).map(job => job.job_title || 'Role') }
    } catch { rolesWithNoApplications = { count: 0, titles: [] } }

    // Section 4: unfilled agency cover (expired cascades plus urgent requests
    // past deadline) and counters awaiting the employer's response.
    const unfilledAgencyShifts = (expiredShiftsRes.count || 0) + (urgentOverdueRes.count || 0)
    const countersAwaiting = countersRes.count || 0

    return NextResponse.json({
      propertyName: employer.property_name || employer.company_name || null,
      newCandidates,
      applicantsAwaitingReview,
      rolesWithNoApplications,
      unfilledAgencyShifts,
      countersAwaiting,
    })
  } catch (e: any) {
    console.error('Employer brief failed:', e?.message)
    return NextResponse.json({ error: 'Unable to build your brief right now.' }, { status: 500 })
  }
}
