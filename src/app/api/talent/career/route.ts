import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { careerPosition, coursesForSkill, courseMeta } from '@/lib/academy-meta'
import { courseBySlug } from '@/lib/academy'
import { calculateMatchScore } from '@/lib/matching'

// Career Intelligence: where the professional sits, what the live market is
// asking for, the gaps between the two, and the course that closes each gap.
// Salary signals follow the WHC credibility rules - a number is only shown
// with its sample size, and below 30 records nothing is shown at all.

const SALARY_SUPPRESS_BELOW = 30
const SALARY_EARLY_BELOW = 100
const MATCH_UPLIFT_JOB_SAMPLE = 200
const MATCH_UPLIFT_THRESHOLD = 70

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

// Linear-interpolated quartile of a sorted-ascending copy of the values.
function quantile(values: number[], q: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] === undefined) return Math.round(sorted[base])
  return Math.round(sorted[base] + rest * (sorted[base + 1] - sorted[base]))
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()

  // The full profile row: the match-uplift computation below feeds the real
  // matching engine, which reads far more of the profile than the summary
  // fields this route previously selected.
  const { data: candidate } = await admin.from('candidate_profiles')
    .select('*')
    .eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })

  const position = careerPosition(candidate.role_level)
  const isPro = candidate.membership_tier === 'pro'

  // Live demand, straight from the roles that are actually open today.
  // Full rows, newest first: the match-uplift computation runs the real
  // matching engine over (a sample of) these same roles.
  const { data: jobs } = await admin.from('job_listings')
    .select('*')
    .eq('is_live', true).eq('status', 'active')
    .order('posted_date', { ascending: false })
  const liveJobs = jobs || []

  const mySkills = new Set(
    [...(candidate.treatment_skills || []), ...(candidate.services_offered || []), ...(candidate.business_skills || [])]
      .map((skill: string) => String(skill).trim().toLowerCase()),
  )

  const demandCount = new Map<string, number>()
  for (const job of liveJobs) {
    for (const skill of (job.required_skills || [])) {
      const key = String(skill).trim()
      if (key) demandCount.set(key, (demandCount.get(key) || 0) + 1)
    }
  }
  const topDemand = [...demandCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([skill, count]) => ({ skill, count, covered: mySkills.has(skill.toLowerCase()) }))

  // Not Pro: the honest teaser - enough to show the tool is real, no detail.
  if (!isPro) {
    return NextResponse.json({
      pro: false,
      position,
      teaser: {
        liveRoles: liveJobs.length,
        topSkills: topDemand.slice(0, 3).map(entry => entry.skill),
        gapCount: topDemand.filter(entry => !entry.covered).length,
      },
    })
  }

  // Gap -> course recommendations: demanded skills the professional lacks,
  // each mapped to the WHC course that teaches it, plus the ladder's
  // recommended next courses.
  const { data: enrolments } = await admin.from('course_enrollments')
    .select('course_slug, completed_at').eq('candidate_id', candidate.id).not('paid_at', 'is', null)
  const owned = new Set((enrolments || []).map(enrolment => enrolment.course_slug))

  const recommendations: { slug: string; title: string; minutes: number; level: string; closes: string[] }[] = []
  const bySlug = new Map<string, { slug: string; title: string; minutes: number; level: string; closes: string[] }>()
  const addRec = (slug: string, closes: string | null) => {
    if (owned.has(slug)) return
    const course = courseBySlug(slug)
    if (!course) return
    let entry = bySlug.get(slug)
    if (!entry) {
      entry = { slug, title: course.title, minutes: course.minutes, level: courseMeta(slug).level, closes: [] }
      bySlug.set(slug, entry)
      recommendations.push(entry)
    }
    if (closes && !entry.closes.includes(closes)) entry.closes.push(closes)
  }
  for (const entry of topDemand.filter(item => !item.covered)) {
    for (const slug of coursesForSkill(entry.skill)) addRec(slug, entry.skill)
  }
  for (const slug of position.recommendedSlugs) addRec(slug, null)

  // Demand at their level and the level above (loose label match - honest
  // about being an approximation of role wording across employers).
  const currentKey = String(candidate.role_level || '').toLowerCase()
  const nextKey = String(position.nextLabel || '').toLowerCase()
  const rolesAtLevel = currentKey ? liveJobs.filter(job => String(job.required_role_level || '').toLowerCase().includes(currentKey)).length : 0
  const rolesNextLevel = nextKey ? liveJobs.filter(job => String(job.required_role_level || '').toLowerCase().includes(nextKey)).length : 0

  // Salary signal: advertised salaries for their role level over 12 months,
  // shown only when the sample clears the credibility thresholds.
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data: salaryRows } = await admin.from('salary_records')
    .select('amount_min, amount_max, role_level, kind')
    .eq('kind', 'advertised').eq('period', 'annual').gte('recorded_at', since)
  const relevant = (salaryRows || []).filter(row =>
    currentKey && String(row.role_level || '').toLowerCase().includes(currentKey))
  const midpoints = relevant
    .map(row => {
      const low = row.amount_min ? Number(row.amount_min) : null
      const high = row.amount_max ? Number(row.amount_max) : null
      if (low && high) return Math.round((low + high) / 2)
      return low || high || null
    })
    .filter((value): value is number => Boolean(value))

  const salarySample = midpoints.length
  const salary = salarySample >= SALARY_SUPPRESS_BELOW
    ? {
        median: median(midpoints),
        // The typical range: the middle half of advertised midpoints. Shown
        // only under the same suppression rules as the median itself.
        p25: quantile(midpoints, 0.25),
        p75: quantile(midpoints, 0.75),
        sample: salarySample,
        confidence: salarySample >= SALARY_EARLY_BELOW ? 'medium' : 'early_signal',
        yourExpectation: candidate.salary_expectation_min && candidate.salary_expectation_max
          ? Math.round((Number(candidate.salary_expectation_min) + Number(candidate.salary_expectation_max)) / 2)
          : candidate.salary_expectation_min
            ? Number(candidate.salary_expectation_min)
            : null,
      }
    : { suppressed: true as const, sample: salarySample }

  // Profile views: approved-employer views of this profile from the
  // candidate_profile_viewed event stream, with distinct employer counts.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: viewRows } = await admin.from('analytics_events')
    .select('employer_id, created_at')
    .eq('event_name', 'candidate_profile_viewed')
    .eq('candidate_id', candidate.id)
    .gte('created_at', thirtyDaysAgo)
  const allViews = viewRows || []
  const weekViews = allViews.filter(row => row.created_at >= sevenDaysAgo)
  const distinctEmployers = (rows: { employer_id: string | null }[]) =>
    new Set(rows.map(row => row.employer_id).filter(Boolean)).size
  const profileViews = {
    week: { views: weekViews.length, employers: distinctEmployers(weekViews) },
    month: { views: allViews.length, employers: distinctEmployers(allViews) },
  }

  // Match uplift: genuinely recomputed, never estimated. For each of the top
  // in-demand skills the professional lacks, run the real matching engine
  // over the live roles (the most recent 200 when there are more) with the
  // profile as-is versus with that one skill added, and report the change in
  // 70%+ matches only when it is a real increase.
  const upliftSample = liveJobs.slice(0, MATCH_UPLIFT_JOB_SAMPLE)
  const countMatches = (profile: any) =>
    upliftSample.filter(job => calculateMatchScore(profile, job).score >= MATCH_UPLIFT_THRESHOLD).length
  const baselineMatches = countMatches(candidate)
  // The engine falls back through treatment_skills -> skills -> services_offered,
  // so the augmented profile must extend the same effective list the baseline
  // used - otherwise the comparison would not be like-for-like.
  const effectiveSkills: string[] = candidate.treatment_skills || (candidate as any).skills || candidate.services_offered || []
  const matchUplift: { skill: string; from: number; to: number }[] = []
  for (const entry of topDemand.filter(item => !item.covered).slice(0, 3)) {
    const augmented = { ...candidate, treatment_skills: [...effectiveSkills, entry.skill] }
    const withSkill = countMatches(augmented)
    if (withSkill > baselineMatches) matchUplift.push({ skill: entry.skill, from: baselineMatches, to: withSkill })
  }

  return NextResponse.json({
    pro: true,
    position,
    market: {
      liveRoles: liveJobs.length,
      rolesAtLevel,
      rolesNextLevel,
      topDemand,
    },
    gaps: topDemand.filter(entry => !entry.covered),
    recommendations: recommendations.slice(0, 6),
    salary,
    profileViews,
    matchUplift: {
      baseline: baselineMatches,
      threshold: MATCH_UPLIFT_THRESHOLD,
      sampledJobs: upliftSample.length,
      totalLiveJobs: liveJobs.length,
      skills: matchUplift,
    },
  })
}
