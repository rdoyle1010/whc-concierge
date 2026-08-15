import 'server-only'

import { ACADEMY, CORE_SLUGS, type AcademyCourse } from '@/lib/academy'
import { ACADEMY_ANSWERS } from '@/lib/academy-answers'
import { courseImage } from '@/lib/academy-extras'
import { createAdminClient } from '@/lib/supabase/admin'

export type ManagedAcademyCourse = AcademyCourse & {
  image_url: string
  is_active: boolean
  is_core: boolean
  is_custom: boolean
  managed: boolean
  answer_key?: number[]
}

type CourseRow = {
  slug: string
  title: string
  tagline: string
  category: AcademyCourse['category']
  minutes: number
  price: number
  image_url: string | null
  lessons: AcademyCourse['lessons']
  quiz: AcademyCourse['quiz']
  answer_key: number[]
  is_active: boolean
  is_core: boolean
  is_custom: boolean
}

function baseCourse(course: AcademyCourse): ManagedAcademyCourse {
  return {
    ...course,
    price: course.price ?? 1000,
    image_url: courseImage(course.slug),
    is_active: true,
    is_core: CORE_SLUGS.includes(course.slug),
    is_custom: false,
    managed: false,
    answer_key: ACADEMY_ANSWERS[course.slug] || [],
  }
}

function rowCourse(row: CourseRow): ManagedAcademyCourse {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    category: row.category,
    minutes: row.minutes,
    price: row.price,
    image_url: row.image_url || courseImage(row.slug),
    lessons: Array.isArray(row.lessons) ? row.lessons : [],
    quiz: Array.isArray(row.quiz) ? row.quiz : [],
    is_active: row.is_active,
    is_core: row.is_core,
    is_custom: row.is_custom,
    managed: true,
    answer_key: Array.isArray(row.answer_key) ? row.answer_key : [],
  }
}

export function publicCourse(course: ManagedAcademyCourse) {
  const { answer_key: _answerKey, ...safe } = course
  return safe
}

export async function getAcademyCatalog(includeArchived = false): Promise<ManagedAcademyCourse[]> {
  const base = ACADEMY.map(baseCourse)
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('academy_courses').select('*').order('created_at')
    if (error) throw error
    const rows = (data || []).map(rowCourse)
    const overrides = new Map(rows.map(course => [course.slug, course]))
    const merged = base.map(course => overrides.get(course.slug) || course)
    const baseSlugs = new Set(base.map(course => course.slug))
    merged.push(...rows.filter(course => !baseSlugs.has(course.slug)))
    return includeArchived ? merged : merged.filter(course => course.is_active)
  } catch (error) {
    console.error('[Academy catalogue] using code fallback:', error instanceof Error ? error.message : error)
    return includeArchived ? base : base.filter(course => course.is_active)
  }
}

export async function getAcademyCourseBySlug(slug: string, includeArchived = false) {
  const courses = await getAcademyCatalog(includeArchived)
  return courses.find(course => course.slug === slug) || null
}

export async function getAcademyAnswerKey(slug: string) {
  const course = await getAcademyCourseBySlug(slug, true)
  return course?.answer_key || []
}

