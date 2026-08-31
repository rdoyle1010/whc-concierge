import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAcademyCatalog } from '@/lib/academy-catalog-server'
import { coursesForSkill } from '@/lib/academy-meta'

// Live demand per Academy course: how many live WHC roles ask for a skill the
// course teaches. A job counts once per course even when several of its
// skills map to it. Cached for five minutes - the public Academy page reads
// this on every visit and the truth does not move faster than that.

const getCourseDemand = unstable_cache(async (): Promise<Record<string, number>> => {
  const admin = createAdminClient()
  const { data: jobs, error } = await admin
    .from('job_listings')
    .select('id,required_skills,preferred_business_skills')
    .eq('is_live', true)
    .eq('status', 'active')
  if (error || !jobs?.length) return {}

  const courses = await getAcademyCatalog(false)
  const slugs = courses.map(course => course.slug)

  const counts: Record<string, number> = {}
  for (const job of jobs) {
    const skills = [
      ...(Array.isArray(job.required_skills) ? job.required_skills : []),
      ...(Array.isArray(job.preferred_business_skills) ? job.preferred_business_skills : []),
    ].filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
    if (!skills.length) continue

    const matched = new Set<string>()
    for (const skill of skills) for (const slug of coursesForSkill(skill, slugs)) matched.add(slug)
    for (const slug of matched) counts[slug] = (counts[slug] || 0) + 1
  }
  return counts
}, ['academy-course-demand-v1'], { revalidate: 300 })

export async function GET() {
  try {
    const demand = await getCourseDemand()
    return NextResponse.json(demand, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Academy demand failed:', error)
    return NextResponse.json({})
  }
}
