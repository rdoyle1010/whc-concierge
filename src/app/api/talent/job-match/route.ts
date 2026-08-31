import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { coursesForSkill } from '@/lib/academy-meta'
import { ACADEMY } from '@/lib/academy'

// Explains a signed-in professional's match with one live role: the score,
// what drives it, which required skills are missing, and which Academy course
// teaches each missing skill. Course lookup happens here so the client never
// ships the full Academy catalogue.

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const jobId = String(req.nextUrl.searchParams.get('job') || '').trim()
    if (!jobId) return NextResponse.json({ error: 'A job id is required.' }, { status: 400 })

    const admin = createAdminClient()
    const [{ data: candidate }, { data: job }] = await Promise.all([
      admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      admin.from('job_listings').select('*').eq('id', jobId).eq('is_live', true).maybeSingle(),
    ])
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
    if (!job) return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })

    const result = calculateMatchScore(candidate, job)

    const matched = new Set(result.matchingSkills.map(skill => skill.toLowerCase()))
    const requiredSkills: string[] = Array.isArray(job.required_skills) ? job.required_skills : []
    const missingRequiredSkills = requiredSkills.filter(skill => !matched.has(String(skill).toLowerCase()))

    // For up to three missing skills, name the Academy course that teaches it.
    const courseSuggestions = missingRequiredSkills.slice(0, 3).map(skill => {
      const slug = coursesForSkill(skill)[0] || null
      const course = slug ? ACADEMY.find(c => c.slug === slug) : null
      return { skill, slug: course ? course.slug : null, title: course ? course.title : null }
    })

    // "Why you match": every scored dimension as a named percentage.
    const DIMENSION_LABELS: Record<string, string> = {
      roleLevel: 'Career level', treatmentSkills: 'Treatment skills', brands: 'Product house experience',
      qualifications: 'Qualifications', experience: 'Experience', businessSkills: 'Leadership and business skills',
      systems: 'Booking systems', location: 'Location', salaryFit: 'Salary alignment', availability: 'Availability',
      proficiencyDepth: 'Skill depth', profileCompleteness: 'Profile completeness', shiftCompatibility: 'Shift fit',
    }
    const dimensions = Object.entries(result.breakdown || {})
      .filter(([key, value]) => DIMENSION_LABELS[key] && typeof value === 'number' && value >= 0)
      .map(([key, value]) => ({ key, label: DIMENSION_LABELS[key], value: Math.round(Number(value)) }))
      .sort((a, b) => b.value - a.value)

    // "Your strongest evidence": the candidate's own CV-derived evidence
    // lines, ranked by relevance to this exact role. Their words, not ours.
    const jobText = [job.job_title, job.job_description, job.required_role_level,
      ...(requiredSkills), ...(Array.isArray(job.preferred_business_skills) ? job.preferred_business_skills : [])]
      .join(' ').toLowerCase()
    const jobTokens = new Set(jobText.split(/[^a-z0-9]+/).filter(token => token.length > 3))
    const evidenceLines: string[] = Array.isArray(candidate.career_evidence) ? candidate.career_evidence : []
    const strongestEvidence = evidenceLines
      .map(line => {
        const tokens = String(line).toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 3)
        const overlap = tokens.filter(token => jobTokens.has(token)).length
        return { line: String(line), overlap }
      })
      .filter(entry => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map(entry => entry.line)

    // "What the employer may question": the gaps, phrased as the scrutiny an
    // interviewer would genuinely apply - which is exactly what Interview
    // Ready exists to prepare for.
    const employerMayQuestion: string[] = []
    const bd: Record<string, number> = result.breakdown || {}
    const progression = (result as any).progression
    if (progression?.isStepUp) employerMayQuestion.push(`This is a step up from ${String(candidate.role_level || 'your current level')} - expect questions on your readiness to own the wider role.`)
    if (missingRequiredSkills.length) employerMayQuestion.push(`Required skills not yet evidenced on your profile: ${missingRequiredSkills.slice(0, 3).join(', ')}.`)
    if ((bd.brands ?? -1) >= 0 && bd.brands < 60 && Array.isArray(job.required_brands) && job.required_brands.length) employerMayQuestion.push(`No stated experience with their product houses (${job.required_brands.slice(0, 2).join(', ')}) - be ready to speak to how quickly you absorb new brand protocols.`)
    if ((bd.experience ?? -1) >= 0 && bd.experience < 60 && job.min_years_experience) employerMayQuestion.push(`The role asks for ${job.min_years_experience}+ years - prepare to evidence depth rather than duration.`)
    if ((bd.businessSkills ?? -1) >= 0 && bd.businessSkills < 60) employerMayQuestion.push('Commercial and leadership evidence looks light against this role - have one concrete revenue, retail or team story ready.')
    if ((bd.location ?? -1) >= 0 && bd.location < 60) employerMayQuestion.push('The commute or relocation practicality - answer it before they ask.')

    return NextResponse.json({
      score: result.score,
      label: result.label,
      breakdown: result.breakdown,
      dimensions,
      matchingSkills: result.matchingSkills,
      missingRequiredSkills,
      strongestEvidence,
      hasEvidenceBank: evidenceLines.length > 0,
      employerMayQuestion: employerMayQuestion.slice(0, 4),
      interviewReadyHref: `/talent/interview-ready?job=${encodeURIComponent(jobId)}`,
      mode: result.mode || 'permanent',
      hardStop: result.hardStop,
      hardStopReason: result.hardStopReason || null,
      courseSuggestions,
    })
  } catch (e: any) {
    console.error('Job match explanation failed:', e?.message)
    return NextResponse.json({ error: 'Unable to calculate your match right now.' }, { status: 500 })
  }
}
