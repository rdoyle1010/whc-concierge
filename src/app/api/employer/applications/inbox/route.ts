import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { ACADEMY } from '@/lib/academy'

const COURSE_TITLES = new Map(ACADEMY.map(course => [course.slug, course.title]))
const courseTitle = (slug: string) =>
  COURSE_TITLES.get(slug) || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

// The employer's applications inbox. Served through the service role because an
// applicant has chosen to share their profile with THIS employer by applying -
// discovery visibility rules (approval queue, stealth mode) must not blank the
// profile of someone who applied, which is what the old client-side query did.

const CANDIDATE_FIELDS = [
  'id','user_id','full_name','headline','role_level','location','services_offered','treatment_skills','experience_years',
  'profile_image_url','review_score','review_count','bio','qualifications','product_houses','systems_experience',
  'business_skills','career_evidence','has_insurance','cv_url','certificates_urls','is_featured','featured_until',
  'salary_expectation_min','salary_expectation_max','commercial_experience','revenue_responsibility','team_size_managed','desired_roles','portfolio_url','availability_status',
].join(',')

const norm = (value: unknown) => String(value ?? '').trim().toLowerCase()

function missingFrom(required: unknown, pool: string[]): string[] {
  if (!Array.isArray(required)) return []
  const poolSet = new Set(pool.map(norm).filter(Boolean))
  return required
    .map((item: unknown) => String(item ?? '').trim())
    .filter(Boolean)
    .filter((item: string) => {
      const key = norm(item)
      if (poolSet.has(key)) return false
      // Loose containment so "Deep Tissue" matches "Deep Tissue Massage".
      for (const entry of poolSet) if (entry.includes(key) || key.includes(entry)) return false
      return true
    })
}

function buildFit(candidate: any, job: any) {
  const jobForMatch = { ...job, title: job.job_title, required_product_houses: job.required_brands }
  const match = calculateMatchScore(candidate, jobForMatch)

  const skillsPool = [...(candidate.services_offered || []), ...(candidate.treatment_skills || [])]
  const gaps: { area: string; items: string[]; advice: string }[] = []

  const missingSkills = missingFrom(job.required_skills, skillsPool)
  if (missingSkills.length) gaps.push({ area: 'Treatments & skills', items: missingSkills, advice: 'Usually closed with in-house training or shadowing during the first weeks.' })

  const missingQuals = missingFrom(job.required_qualifications, candidate.qualifications || [])
  if (missingQuals.length) gaps.push({ area: 'Qualifications', items: missingQuals, advice: 'Ask whether an equivalent qualification or enrolment on a course would satisfy this.' })

  const missingSystems = missingFrom(job.required_systems, candidate.systems_experience || [])
  if (missingSystems.length) gaps.push({ area: 'Systems', items: missingSystems, advice: 'Booking systems are typically learned in days - prior experience on any system transfers well.' })

  const missingBrands = missingFrom(job.required_brands, candidate.product_houses || [])
  if (missingBrands.length) gaps.push({ area: 'Product houses', items: missingBrands, advice: 'Brand houses run their own product training; experience with comparable houses shortens it.' })

  const requiredYears = Number(job.min_years_experience || 0)
  const candidateYears = Number(candidate.experience_years ?? candidate.years_experience ?? 0)
  if (requiredYears > 0 && candidateYears < requiredYears) {
    gaps.push({ area: 'Experience', items: [`${candidateYears} of ${requiredYears} years listed`], advice: 'Weigh the shortfall against the strength of their career evidence and references.' })
  }

  return {
    score: match.score,
    label: match.label,
    colour: match.colour,
    explanation: match.matchExplanation || '',
    strengths: match.matchingSkills || [],
    // The same factor-by-factor breakdown the talent sees when they match -
    // both sides of a placement should be reading from one algorithm.
    breakdown: match.breakdown || null,
    progression: match.progression || null,
    gaps,
  }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer account required' }, { status: 403 })

  const { data: jobs } = await admin.from('job_listings').select('*').eq('employer_id', employer.id)
  const jobList = jobs || []
  if (!jobList.length) return NextResponse.json({ applications: [], employer: { id: employer.id, company_name: employer.company_name, property_name: employer.property_name } })
  const jobMap = new Map(jobList.map((job: any) => [job.id, job]))

  const { data: applications, error } = await admin.from('applications')
    .select('*')
    .in('role_id', jobList.map((job: any) => job.id))
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'We could not load your applications just now.' }, { status: 500 })

  const rows = applications || []

  // A declined offer is stored as status 'rejected' for pipeline purposes, but
  // it must never READ as an employer rejection - join the offers to tell them apart.
  const applicationIds = rows.map((application: any) => application.id)
  const [{ data: offers }, { data: interviewRows }] = applicationIds.length
    ? await Promise.all([
        admin.from('application_offers').select('application_id,status').in('application_id', applicationIds),
        admin.from('application_interviews').select('id,application_id,round_number,interview_method,proposed_slots,selected_slot,status,employer_note,candidate_note').in('application_id', applicationIds).order('round_number', { ascending: true }),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }]
  const offerStatusByApplication = new Map((offers || []).map((offer: any) => [offer.application_id, offer.status]))
  const interviewsByApplication = new Map<string, any[]>()
  for (const interview of interviewRows || []) {
    const list = interviewsByApplication.get(interview.application_id) || []
    list.push(interview)
    interviewsByApplication.set(interview.application_id, list)
  }

  const candidateIds = Array.from(new Set(rows.map((application: any) => application.candidate_id).filter(Boolean)))
  const { data: candidates } = candidateIds.length
    ? await admin.from('candidate_profiles').select(CANDIDATE_FIELDS).in('id', candidateIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.id, candidate]))

  // Academy training: completed courses with certificates and quiz scores.
  const { data: enrolments } = candidateIds.length
    ? await admin.from('course_enrollments')
        .select('candidate_id,course_slug,quiz_score,completed_at,certificate_code')
        .in('candidate_id', candidateIds)
        .not('completed_at', 'is', null)
    : { data: [] as any[] }
  const academyByCandidate = new Map<string, any[]>()
  for (const enrolment of enrolments || []) {
    const list = academyByCandidate.get(enrolment.candidate_id) || []
    list.push({
      title: courseTitle(enrolment.course_slug),
      quiz_score: enrolment.quiz_score,
      completed_at: enrolment.completed_at,
      certificate_code: enrolment.certificate_code,
    })
    academyByCandidate.set(enrolment.candidate_id, list)
  }

  // Endorsements: recent written reviews left about the candidate.
  const candidateUserIds = Array.from(new Set((candidates || []).map((candidate: any) => candidate.user_id).filter(Boolean)))
  const { data: reviewRows } = candidateUserIds.length
    ? await admin.from('reviews')
        .select('reviewed_id,rating,comment,created_at')
        .in('reviewed_id', candidateUserIds)
        .order('created_at', { ascending: false })
        .limit(60)
    : { data: [] as any[] }
  const endorsementsByUser = new Map<string, any[]>()
  for (const review of reviewRows || []) {
    const list = endorsementsByUser.get(review.reviewed_id) || []
    if (list.length < 3 && review.comment) list.push({ rating: review.rating, comment: String(review.comment).slice(0, 300), created_at: review.created_at })
    endorsementsByUser.set(review.reviewed_id, list)
  }

  const enriched = rows.map((application: any) => {
    const candidate = candidateMap.get(application.candidate_id) || null
    const job = jobMap.get(application.role_id) || jobMap.get(application.job_id) || null
    return {
      ...application,
      candidate_profiles: candidate,
      job_listings: job ? { job_title: job.job_title } : null,
      fit: candidate && job ? buildFit(candidate, job) : null,
      academy: candidate ? (academyByCandidate.get(candidate.id) || []) : [],
      endorsements: candidate?.user_id ? (endorsementsByUser.get(candidate.user_id) || []) : [],
      offer_declined: application.status === 'rejected' && offerStatusByApplication.get(application.id) === 'declined',
      interviews: interviewsByApplication.get(application.id) || [],
    }
  })

  return NextResponse.json({ applications: enriched, employer: { id: employer.id, company_name: employer.company_name, property_name: employer.property_name } })
}
