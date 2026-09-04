import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// Role intelligence for an approved employer - every figure computed from
// live platform data on request, with its basis returned alongside it.
// Nothing is estimated and nothing is shown below its minimum sample:
//   - conversion publishes at 20 role views in the last 30 days,
//   - benchmark and salary comparisons publish at 3 comparable roles,
//   - time to hire publishes at 2 completed hires.
// Below a threshold the client shows an honest 'building' line instead.

export const dynamic = 'force-dynamic'

const MIN_VIEWS_FOR_CONVERSION = 20
const MIN_COMPARABLE_ROLES = 3
const MIN_HIRES_FOR_TIME_TO_HIRE = 2
const VIEW_WINDOW_DAYS = 30
const ABANDONED_AFTER_HOURS = 48
const DAY_MS = 24 * 60 * 60 * 1000

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function levelKey(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

// Loose role-level comparability: honest about role wording varying across
// employers - one label containing the other counts as comparable.
function looselyComparable(a: string, b: string): boolean {
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

function salaryMidpoint(min: unknown, max: unknown): number | null {
  const low = min ? Number(min) : null
  const high = max ? Number(max) : null
  if (low && high) return Math.round((low + high) / 2)
  return low || high || null
}

function weeksLive(postedDate: unknown, now: number): number {
  const posted = postedDate ? new Date(String(postedDate)).getTime() : NaN
  if (!Number.isFinite(posted)) return 1
  return Math.max(1, (now - posted) / (7 * DAY_MS))
}

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id, approval_status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })
    if (employer.approval_status !== 'approved') return NextResponse.json({ error: 'Your employer account must be approved first.' }, { status: 403 })

    const now = Date.now()
    const viewsSince = new Date(now - VIEW_WINDOW_DAYS * DAY_MS).toISOString()
    const salarySince = new Date(now - 365 * DAY_MS).toISOString()
    const abandonedBefore = new Date(now - ABANDONED_AFTER_HOURS * 60 * 60 * 1000).toISOString()

    const [myJobsRes, platformJobsRes, salaryRes] = await Promise.all([
      admin.from('job_listings')
        .select('id, job_title, is_live, status, required_role_level, salary_min, salary_max, posted_date')
        .eq('employer_id', employer.id),
      admin.from('job_listings')
        .select('id, employer_id, required_role_level, salary_min, salary_max, posted_date')
        .eq('is_live', true),
      // Advertised annual salary records over 12 months - the house
      // credibility basis shared with the talent-side salary signal.
      admin.from('salary_records')
        .select('amount_min, amount_max, role_level')
        .eq('kind', 'advertised').eq('period', 'annual')
        .gte('recorded_at', salarySince),
    ])

    const myJobs = (myJobsRes.data as any[]) || []
    const myLiveJobs = myJobs.filter(job => job.is_live)
    const myJobIds = myJobs.map(job => job.id)
    const platformJobs = (platformJobsRes.data as any[]) || []
    const salaryRows = (salaryRes.data as any[]) || []

    // Applications on this employer's roles - drafts included, because the
    // abandonment figure is drafts that were never submitted. Rows link via
    // role_id (current convention) with job_id as the legacy column.
    let myApps: any[] = []
    if (myJobIds.length) {
      const idList = myJobIds.join(',')
      const { data } = await admin.from('applications')
        .select('id, role_id, job_id, status, created_at, updated_at, hired_at, match_score')
        .or(`role_id.in.(${idList}),job_id.in.(${idList})`)
      myApps = data || []
    }

    // Role views in the last 30 days, from the job_viewed event stream.
    const viewsByJob = new Map<string, number>()
    if (myJobIds.length) {
      const { data: viewRows } = await admin.from('analytics_events')
        .select('job_id')
        .eq('event_name', 'job_viewed')
        .in('job_id', myJobIds)
        .gte('created_at', viewsSince)
      for (const row of (viewRows as any[]) || []) {
        if (row.job_id) viewsByJob.set(row.job_id, (viewsByJob.get(row.job_id) || 0) + 1)
      }
    }

    // Platform-wide application counts for live roles, for the per-week
    // benchmark. One query across all live roles, then grouped in memory.
    const platformAppCount = new Map<string, number>()
    const platformIds = platformJobs.map(job => job.id)
    if (platformIds.length) {
      const idList = platformIds.join(',')
      const { data: platformApps } = await admin.from('applications')
        .select('role_id, job_id, status')
        .or(`role_id.in.(${idList}),job_id.in.(${idList})`)
        .neq('status', 'draft')
      for (const app of (platformApps as any[]) || []) {
        const jobId = app.role_id || app.job_id
        if (jobId) platformAppCount.set(jobId, (platformAppCount.get(jobId) || 0) + 1)
      }
    }

    const appsForJob = (jobId: string) => myApps.filter(app => (app.role_id || app.job_id) === jobId)

    const roles = myLiveJobs.map(job => {
      const apps = appsForJob(job.id)
      const submitted = apps.filter(app => app.status !== 'draft')
      const views = viewsByJob.get(job.id) || 0
      const conversionPct = views >= MIN_VIEWS_FOR_CONVERSION
        ? Math.round((submitted.length / views) * 100)
        : null
      const abandoned = apps.filter(app => app.status === 'draft' && app.created_at && app.created_at < abandonedBefore).length

      // Benchmark: this role's applications per week live against the
      // platform average for loosely level-comparable live roles.
      const myLevel = levelKey(job.required_role_level)
      const comparables = platformJobs.filter(other =>
        other.id !== job.id && looselyComparable(levelKey(other.required_role_level), myLevel))
      let benchmark: { comparableCount: number; pctDiff: number } | null = null
      if (comparables.length >= MIN_COMPARABLE_ROLES) {
        const rates = comparables.map(other => (platformAppCount.get(other.id) || 0) / weeksLive(other.posted_date, now))
        const avgRate = rates.reduce((total, rate) => total + rate, 0) / rates.length
        if (avgRate > 0) {
          const myRate = submitted.length / weeksLive(job.posted_date, now)
          benchmark = { comparableCount: comparables.length, pctDiff: Math.round(((myRate - avgRate) / avgRate) * 100) }
        }
      }
      const benchmarkComparables = comparables.length

      // Salary competitiveness: this role's midpoint against the median
      // midpoint of comparable live roles plus advertised salary records at
      // the same (loosely matched) level over the last 12 months.
      const myMid = salaryMidpoint(job.salary_min, job.salary_max)
      const marketMidpoints = [
        ...comparables.map(other => salaryMidpoint(other.salary_min, other.salary_max)),
        ...salaryRows
          .filter(row => looselyComparable(levelKey(row.role_level), myLevel))
          .map(row => salaryMidpoint(row.amount_min, row.amount_max)),
      ].filter((value): value is number => Boolean(value))
      let salary: { pctDiff: number; marketMedian: number; midpoint: number; sample: number } | null = null
      if (myMid && marketMidpoints.length >= MIN_COMPARABLE_ROLES) {
        const marketMedian = median(marketMidpoints)
        if (marketMedian && marketMedian > 0) {
          salary = {
            pctDiff: Math.round(((myMid - marketMedian) / marketMedian) * 100),
            marketMedian: Math.round(marketMedian),
            midpoint: myMid,
            sample: marketMidpoints.length,
          }
        }
      }

      // Candidate quality: the average match score of submitted applicants,
      // only when the column actually holds values.
      const scores = submitted
        .map(app => Number(app.match_score))
        .filter(score => Number.isFinite(score) && score > 0)
      const quality = scores.length
        ? { avgScore: Math.round(scores.reduce((total, score) => total + score, 0) / scores.length), sample: scores.length }
        : null

      return {
        id: job.id,
        title: job.job_title || 'Role',
        views,
        viewsNeeded: MIN_VIEWS_FOR_CONVERSION,
        applications: submitted.length,
        conversionPct,
        abandoned,
        benchmark,
        benchmarkComparables,
        salary,
        salaryComparables: marketMidpoints.length,
        hasSalaryBand: Boolean(myMid),
        quality,
      }
    })

    // Time to hire: median days from application created to acceptance,
    // across this employer's filled roles.
    const hireDays = myApps
      .filter(app => app.status === 'accepted' && app.created_at)
      .map(app => {
        const start = new Date(app.created_at).getTime()
        const end = new Date(app.hired_at || app.updated_at || app.created_at).getTime()
        return Number.isFinite(start) && Number.isFinite(end) && end >= start ? (end - start) / DAY_MS : null
      })
      .filter((value): value is number => value !== null)
    const timeToHire = hireDays.length >= MIN_HIRES_FOR_TIME_TO_HIRE
      ? { medianDays: Math.round(median(hireDays) || 0), hires: hireDays.length }
      : null

    const totalViews = roles.reduce((total, role) => total + role.views, 0)
    const totalApplications = roles.reduce((total, role) => total + role.applications, 0)
    const aggregate = {
      liveRoles: roles.length,
      views: totalViews,
      applications: totalApplications,
      conversionPct: totalViews >= MIN_VIEWS_FOR_CONVERSION
        ? Math.round((totalApplications / totalViews) * 100)
        : null,
      abandoned: roles.reduce((total, role) => total + role.abandoned, 0),
      timeToHire,
      hiresRecorded: hireDays.length,
    }

    return NextResponse.json({
      roles,
      aggregate,
      thresholds: {
        conversionViews: MIN_VIEWS_FOR_CONVERSION,
        comparableRoles: MIN_COMPARABLE_ROLES,
        hires: MIN_HIRES_FOR_TIME_TO_HIRE,
        viewWindowDays: VIEW_WINDOW_DAYS,
        abandonedAfterHours: ABANDONED_AFTER_HOURS,
      },
    })
  } catch (e: any) {
    console.error('Employer intelligence failed:', e?.message)
    return NextResponse.json({ error: 'Unable to compute role intelligence right now.' }, { status: 500 })
  }
}
