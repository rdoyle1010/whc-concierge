import 'server-only'

import { ACADEMY, CORE_SLUGS, type AcademyCourse } from '@/lib/academy'
import { ACADEMY_ANSWERS } from '@/lib/academy-answers'
import { courseImage } from '@/lib/academy-extras'
import { createAdminClient } from '@/lib/supabase/admin'

// The fields an admin genuinely controls on a course that is defined in code.
// Everything else about such a course - title, modules, lesson text, quiz and
// answer key - comes from the platform, so a release always ships the newest
// teaching content and no database row can ever freeze it.
export type AcademyAdminSettings = {
  price: number
  image_url: string | null
  is_active: boolean
  tagline: string | null
  sort_order: number | null
}

export type AcademyCourseOverride = {
  title: string | null
  tagline: string | null
  price: number | null
  image_url: string | null
  is_active: boolean
  sort_order: number | null
}

export type ManagedAcademyCourse = AcademyCourse & {
  image_url: string
  is_active: boolean
  is_core: boolean
  is_custom: boolean
  managed: boolean
  // True when the course is authored in code (src/lib/academy.ts plus its
  // content pack). Those courses take their teaching content from code; only
  // the commercial fields above are admin-editable.
  code_defined: boolean
  sort_order: number | null
  // True when image_url came from an admin upload rather than the code default,
  // so public surfaces know an admin choice must not be second-guessed.
  image_admin_set: boolean
  // The raw academy_courses row behind this course, when one exists. Admin
  // surfaces use it to show exactly what has been overridden.
  override: AcademyCourseOverride | null
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
  sort_order?: number | null
}

// sort_order arrives with migration 20260901110000. Until it runs, reads see
// undefined and writes retry without the column.
function isMissingColumnError(error: { message?: string } | null | undefined) {
  return Boolean(error && /column/i.test(error.message || ''))
}

const cleanNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
    code_defined: true,
    sort_order: null,
    image_admin_set: false,
    override: null,
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
    code_defined: false,
    sort_order: cleanNumber(row.sort_order),
    image_admin_set: Boolean(row.image_url),
    override: overrideOf(row),
    answer_key: Array.isArray(row.answer_key) ? row.answer_key : [],
  }
}

function overrideOf(row: CourseRow): AcademyCourseOverride {
  return {
    title: row.title || null,
    tagline: row.tagline || null,
    price: cleanNumber(row.price),
    image_url: row.image_url || null,
    is_active: row.is_active,
    sort_order: cleanNumber(row.sort_order),
  }
}

export function publicCourse(course: ManagedAcademyCourse) {
  const { answer_key: _answerKey, override: _override, ...safe } = course
  return safe
}

// Admin display order first (lowest sort_order wins), then the code order.
function bySortOrder(courses: ManagedAcademyCourse[]) {
  return courses
    .map((course, index) => ({ course, index }))
    .sort((a, b) => {
      const left = a.course.sort_order ?? Number.MAX_SAFE_INTEGER
      const right = b.course.sort_order ?? Number.MAX_SAFE_INTEGER
      return left === right ? a.index - b.index : left - right
    })
    .map(entry => entry.course)
}

export async function getAcademyCatalog(includeArchived = false): Promise<ManagedAcademyCourse[]> {
  const base = ACADEMY.map(baseCourse)
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('academy_courses').select('*').order('created_at')
    if (error) throw error
    const rows = (data || []) as CourseRow[]
    const overrides = new Map(rows.map(row => [row.slug, row]))
    // Courses defined in code are authored and maintained in the platform:
    // their content (title, lessons, quiz, answer key, duration) always comes
    // from code so upgrades ship with every deploy. A database row for a code
    // course only carries the commercial controls an admin can change - price,
    // image, summary line, display order and visibility. Courses created in
    // admin (custom) are database-only.
    const merged = base.map(course => {
      const row = overrides.get(course.slug)
      if (!row) return course
      const tagline = String(row.tagline || '').trim()
      return {
        ...course,
        tagline: tagline || course.tagline,
        price: cleanNumber(row.price) ?? course.price,
        image_url: row.image_url || course.image_url,
        image_admin_set: Boolean(row.image_url),
        is_active: row.is_active,
        sort_order: cleanNumber(row.sort_order),
        override: overrideOf(row),
        managed: true,
      }
    })
    const baseSlugs = new Set(base.map(course => course.slug))
    merged.push(...rows.filter(row => !baseSlugs.has(row.slug)).map(rowCourse))
    const ordered = bySortOrder(merged)
    return includeArchived ? ordered : ordered.filter(course => course.is_active)
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

// Upsert the admin-editable settings for one course, creating the
// academy_courses row when the course has never been touched in admin. The
// content columns are seeded from whatever the course currently is, so a code
// course keeps its code content and a custom course keeps its own.
export async function saveAcademyCourseSettings(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  settings: AcademyAdminSettings,
  updatedBy: string,
) {
  const course = await getAcademyCourseBySlug(slug, true)
  if (!course) return { error: 'Course not found' }

  const payload: Record<string, any> = {
    slug: course.slug,
    // Content columns are seeded, never authored here. For a code course they
    // are a snapshot; the merge above ignores them and talent always reads the
    // code content.
    // A code course keeps its row title aligned with the code title, so a
    // stale saved title cannot sit in the database looking authoritative.
    title: course.code_defined ? course.title : (course.override?.title || course.title),
    category: course.category,
    minutes: course.minutes,
    lessons: course.lessons,
    quiz: course.quiz,
    answer_key: course.answer_key || [],
    is_core: course.is_core,
    is_custom: course.is_custom,
    // The admin-editable fields.
    // An empty summary on a code course means "use the platform wording", so
    // the row never freezes a tagline the code has since improved.
    tagline: settings.tagline ?? (course.code_defined ? '' : course.tagline),
    price: settings.price,
    image_url: settings.image_url,
    is_active: settings.is_active,
    sort_order: settings.sort_order,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('academy_courses').upsert(payload, { onConflict: 'slug' })
  if (!error) return { error: null, sortOrderSaved: true }
  if (!isMissingColumnError(error)) return { error: error.message }

  // Migration 20260901110000 has not run yet - save everything else.
  const { sort_order: _sortOrder, ...withoutSortOrder } = payload
  const retry = await admin.from('academy_courses').upsert(withoutSortOrder, { onConflict: 'slug' })
  if (retry.error) return { error: retry.error.message }
  return { error: null, sortOrderSaved: false }
}
