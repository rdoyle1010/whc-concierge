import { NextRequest, NextResponse } from 'next/server'
import { getAcademyCatalog, getAcademyCourseBySlug, publicCourse } from '@/lib/academy-catalog-server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim()
  if (slug) {
    const course = await getAcademyCourseBySlug(slug, true)
    return course
      ? NextResponse.json({ course: publicCourse(course) })
      : NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
  const courses = await getAcademyCatalog(false)
  return NextResponse.json({ courses: courses.map(publicCourse) })
}
