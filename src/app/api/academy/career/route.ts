import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { getAcademyCatalog } from '@/lib/academy-catalog-server'
import { courseMeta, coursesForSkill, careerPosition } from '@/lib/academy-meta'

// The career engine behind the Academy: where this person is, what the live
// market is asking for that they don't yet have, and which learning closes
// the gap. Directional and honest - no invented percentages.

const norm = (value: unknown) => String(value ?? '').trim().toLowerCase()

function has(pool: string[], item: string): boolean {
  const key = norm(item)
  if (!key) return true
  return pool.some(entry => {
    const candidate = norm(entry)
    return candidate === key || candidate.includes(key) || key.includes(candidate)
  })
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

  const now = new Date().toISOString()
  const [{ data: enrolments }, { data: jobs }, catalog] = await Promise.all([
    admin.from('course_enrollments').select('course_slug,progress,quiz_score,completed_at,certificate_code,paid_at').eq('candidate_id', candidate.id),
    admin.from('job_listings').select('*').eq('is_live', true).or(`expires_at.is.null,expires_at.gt.${now}`).limit(60),
    getAcademyCatalog(false),
  ])

  const activeSlugs = catalog.map(course => course.slug)
  const courseIndex = new Map(catalog.map(course => [course.slug, course]))
  const enrolled = enrolments || []
  const completedSlugs = new Set(enrolled.filter(e => e.completed_at).map(e => e.course_slug))
  const inProgress = enrolled
    .filter(e => e.paid_at && !e.completed_at)
    .map(e => {
      const course = courseIndex.get(e.course_slug)
      const lessonsDone = e.progress ? Object.keys(e.progress).length : 0
      return course ? { slug: e.course_slug, title: course.title, lessons_done: lessonsDone, lessons_total: course.lessons.length } : null
    })
    .filter(Boolean)

  const cpdHours = enrolled.filter(e => e.completed_at).reduce((total, e) => total + courseMeta(e.course_slug).cpdHours, 0)

  // What is the live market asking for that this person doesn't have?
  const skillPool: string[] = [
    ...(candidate.services_offered || []), ...(candidate.treatment_skills || []),
    ...(candidate.business_skills || []), ...(candidate.qualifications || []),
  ]
  const brandPool: string[] = candidate.product_houses || []
  const gapCounts = new Map<string, { count: number; kind: 'skill' | 'brand' }>()
  let matchTotal = 0
  let matchCount = 0
  let topMatch: { score: number; title: string } | null = null

  for (const job of jobs || []) {
    const result = calculateMatchScore(candidate, { ...job, title: job.job_title, required_product_houses: job.required_brands })
    if (result.hardStop) continue
    matchTotal += result.score
    matchCount += 1
    if (!topMatch || result.score > topMatch.score) topMatch = { score: result.score, title: job.job_title }
    if (result.score < 40) continue
    for (const skill of job.required_skills || []) {
      if (!has(skillPool, skill)) {
        const key = String(skill).trim()
        const entry = gapCounts.get(key) || { count: 0, kind: 'skill' as const }
        entry.count += 1
        gapCounts.set(key, entry)
      }
    }
    for (const brand of job.required_brands || []) {
      if (!has(brandPool, brand)) {
        const key = String(brand).trim()
        const entry = gapCounts.get(key) || { count: 0, kind: 'brand' as const }
        entry.count += 1
        gapCounts.set(key, entry)
      }
    }
  }

  const gaps = Array.from(gapCounts.entries())
    .map(([skill, info]) => {
      const slugs = coursesForSkill(skill, activeSlugs).filter(slug => !completedSlugs.has(slug))
      return {
        skill,
        kind: info.kind,
        demanded_in: info.count,
        courses: slugs.slice(0, 2).map(slug => {
          const course = courseIndex.get(slug)
          return course ? { slug, title: course.title, minutes: course.minutes } : null
        }).filter(Boolean),
      }
    })
    .sort((a, b) => b.demanded_in - a.demanded_in)
    .slice(0, 8)

  // Career position and next-step learning.
  const position = careerPosition(candidate.role_level)
  const pathway = position.recommendedSlugs
    .filter(slug => activeSlugs.includes(slug) && !completedSlugs.has(slug))
    .map(slug => {
      const course = courseIndex.get(slug)
      return course ? { slug, title: course.title, tagline: course.tagline, minutes: course.minutes, level: courseMeta(slug).level } : null
    })
    .filter(Boolean)

  return NextResponse.json({
    position: {
      current: position.currentLabel,
      next: position.nextLabel,
      average_match: matchCount ? Math.round(matchTotal / matchCount) : null,
      top_match: topMatch,
      live_roles_assessed: matchCount,
    },
    progress: {
      in_progress: inProgress,
      completed: completedSlugs.size,
      certificates: enrolled.filter(e => e.certificate_code).length,
      cpd_hours: Math.round(cpdHours * 10) / 10,
    },
    gaps,
    pathway,
  })
}
