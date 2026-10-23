import { NextRequest, NextResponse } from 'next/server'
import { getAcademyCourseBySlug, getAcademySummaries, publicCourse } from '@/lib/academy-catalog-server'
import { lessonExtras } from '@/lib/academy-extras'

// The list is cards; one course is the course.
//
// This returned whole courses for the list - every lesson body, every quiz
// question, the rich content document - which made it 305KB uncompressed and
// the heaviest single asset on the platform. Both callers draw cards. Neither
// has ever rendered a lesson from it.
//
// It was also the material people pay for, handed to anyone who opened the
// network tab on the page that sells it.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim()
  if (slug) {
    const course = await getAcademyCourseBySlug(slug, true)
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    // The guest's view, the career benefit and the tips for each lesson of THIS
    // course. The player used to import them, which meant reaching the module
    // that registers all forty-eight courses and their content: 1.7MB of source
    // downloaded to read one course, by the members paying for it.
    const extras = (course.lessons || []).map((_lesson, index) => lessonExtras(slug, index))
    return NextResponse.json({ course: publicCourse(course), extras })
  }
  return NextResponse.json({ courses: await getAcademySummaries() })
}
