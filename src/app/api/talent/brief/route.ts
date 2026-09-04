import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { coursesForSkill } from '@/lib/academy-meta'
import { ACADEMY } from '@/lib/academy'

// The signed-in professional's personal brief - the "what needs my attention
// today" summary at the top of the talent dashboard. Every figure is computed
// from live data; a section with nothing to say returns empty and the client
// omits it. Each section is defensive: a failure empties that section only.
//
// Note: profile view counts are deliberately absent. No view-type event is
// currently emitted anywhere in the codebase (see trackEvent call sites), so
// there is nothing honest to count.

export const dynamic = 'force-dynamic'

const OPEN_APPLICATION_STATUSES = ['pending', 'reviewed', 'shortlisted']
const MATCH_SCORE_FLOOR = 70
const SCORING_CAP = 100

type MatchingRole = { jobId: string; title: string; property: string; score: number }
type StrengthenCourse = { title: string; slug: string; strengthens: number }
type UpcomingInterview = {
  jobTitle: string
  property: string | null
  method: string | null
  proposedSlots: unknown[] | null
  selectedSlot: string | null
}

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

    const nowIso = new Date().toISOString()
    const fortnightAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // Everything independent in one round trip. Failures surface as null data
    // and the affected section stays empty.
    const [recentJobsRes, applicationsRes, offersRes, blocksRes] = await Promise.all([
      admin.from('job_listings').select('*')
        .eq('is_live', true)
        .gte('posted_date', fortnightAgo)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('posted_date', { ascending: false })
        .limit(SCORING_CAP),
      admin.from('applications').select('id,role_id,job_id,status,updated_at')
        .eq('candidate_id', candidate.id)
        .is('archived_at', null)
        .in('status', [...OPEN_APPLICATION_STATUSES, 'interview']),
      admin.from('agency_bookings').select('id', { count: 'exact', head: true })
        .eq('candidate_id', candidate.id)
        .in('status', ['pending', 'countered']),
      admin.from('profile_blocks').select('blocked_employer_id').eq('candidate_id', candidate.id),
    ])

    const recentJobs = recentJobsRes.data || []
    const applications = applicationsRes.data || []
    const blockedEmployerIds = new Set((blocksRes.data || []).map((row: any) => row.blocked_employer_id))

    const openApplications = applications.filter(app => OPEN_APPLICATION_STATUSES.includes(app.status))
    const interviewApplications = applications.filter(app => app.status === 'interview')
      .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
    const appliedJobIds = new Set(applications.map(app => app.role_id || app.job_id).filter(Boolean))

    // Dependent lookups: the jobs behind the candidate's applications, and any
    // scheduled interview details.
    const applicationJobIds = Array.from(appliedJobIds) as string[]
    const interviewApplicationIds = interviewApplications.map(app => app.id)
    const [applicationJobsRes, interviewsRes] = await Promise.all([
      applicationJobIds.length
        ? admin.from('job_listings').select('id,job_title,employer_id,required_skills').in('id', applicationJobIds)
        : Promise.resolve({ data: [] as any[] }),
      interviewApplicationIds.length
        ? admin.from('application_interviews').select('application_id,interview_method,proposed_slots,selected_slot,round_number,created_at')
            .in('application_id', interviewApplicationIds)
            .order('round_number', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ])
    const applicationJobs = new Map(((applicationJobsRes.data as any[]) || []).map(job => [job.id, job]))

    // Section 1: new live roles that genuinely match, scored with the real
    // matching engine. Blocked employers and roles already applied for are
    // excluded before scoring.
    let scoredRoles: { jobId: string; title: string; employerId: string; score: number }[] = []
    try {
      for (const job of recentJobs) {
        if (appliedJobIds.has(job.id)) continue
        if (job.employer_id && blockedEmployerIds.has(job.employer_id)) continue
        const result = calculateMatchScore(candidate, job)
        if (result.hardStop || result.score < MATCH_SCORE_FLOOR) continue
        scoredRoles.push({ jobId: job.id, title: job.job_title || 'Role', employerId: job.employer_id, score: result.score })
      }
      scoredRoles = scoredRoles.sort((a, b) => b.score - a.score).slice(0, 3)
    } catch { scoredRoles = [] }

    // Section 3: the next interview - job, property and any scheduled detail.
    const interviewApplication = interviewApplications[0] || null
    const interviewJob: any = interviewApplication ? applicationJobs.get(interviewApplication.role_id || interviewApplication.job_id) || null : null
    const interviewRow: any = interviewApplication
      ? ((interviewsRes.data as any[]) || []).find(row => row.application_id === interviewApplication.id) || null
      : null

    // Resolve the property names needed by sections 1 and 3 in one query.
    const employerIds = Array.from(new Set([
      ...scoredRoles.map(role => role.employerId),
      ...(interviewJob?.employer_id ? [interviewJob.employer_id] : []),
    ].filter(Boolean)))
    const { data: employers } = employerIds.length
      ? await admin.from('employer_profiles').select('id,property_name,company_name').in('id', employerIds)
      : { data: [] as any[] }
    const employerName = (id: string | null | undefined): string | null => {
      const employer = (employers || []).find((row: any) => row.id === id)
      return employer ? employer.property_name || employer.company_name || null : null
    }

    const newMatchingRoles: MatchingRole[] = scoredRoles.map(role => ({
      jobId: role.jobId,
      title: role.title,
      property: employerName(role.employerId) || role.title,
      score: role.score,
    }))

    // Section 2: Academy courses that would strengthen open applications -
    // required skills those jobs ask for that the candidate does not yet
    // evidence, mapped to the course that teaches each one. Skill comparison
    // mirrors the matching engine's own candidate skill source.
    let strengthenCourses: StrengthenCourse[] = []
    try {
      const candidateSkills: string[] = candidate.treatment_skills || candidate.services_offered || []
      const candidateSkillSet = new Set(candidateSkills.map(skill => String(skill).toLowerCase()))
      const applicationsByCourse = new Map<string, Set<string>>()
      for (const app of openApplications) {
        const job: any = applicationJobs.get(app.role_id || app.job_id)
        if (!job || !Array.isArray(job.required_skills)) continue
        for (const skill of job.required_skills) {
          if (candidateSkillSet.has(String(skill).toLowerCase())) continue
          const slug = coursesForSkill(String(skill))[0]
          if (!slug) continue
          const set = applicationsByCourse.get(slug) || new Set<string>()
          set.add(app.id)
          applicationsByCourse.set(slug, set)
        }
      }
      strengthenCourses = Array.from(applicationsByCourse.entries())
        .map(([slug, appIds]) => {
          const course = ACADEMY.find(c => c.slug === slug)
          return course ? { title: course.title, slug, strengthens: appIds.size } : null
        })
        .filter((entry): entry is StrengthenCourse => entry !== null)
        .sort((a, b) => b.strengthens - a.strengthens)
        .slice(0, 2)
    } catch { strengthenCourses = [] }

    let upcomingInterview: UpcomingInterview | null = null
    if (interviewApplication) {
      upcomingInterview = {
        jobTitle: interviewJob?.job_title || 'your application',
        property: employerName(interviewJob?.employer_id) || null,
        method: interviewRow?.interview_method || null,
        proposedSlots: Array.isArray(interviewRow?.proposed_slots) ? interviewRow.proposed_slots : null,
        selectedSlot: interviewRow?.selected_slot || null,
      }
    }

    // Section 4: agency shift offers waiting on the candidate.
    const offersAwaiting = offersRes.count || 0

    const firstName = String(candidate.full_name || '').trim().split(/\s+/)[0] || null

    return NextResponse.json({
      firstName,
      newMatchingRoles,
      strengthenCourses,
      upcomingInterview,
      offersAwaiting,
    })
  } catch (e: any) {
    console.error('Talent brief failed:', e?.message)
    return NextResponse.json({ error: 'Unable to build your brief right now.' }, { status: 500 })
  }
}
