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

    return NextResponse.json({
      score: result.score,
      label: result.label,
      breakdown: result.breakdown,
      matchingSkills: result.matchingSkills,
      missingRequiredSkills,
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
