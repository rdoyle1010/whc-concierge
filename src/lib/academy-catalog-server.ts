import 'server-only'

import { ACADEMY, CORE_SLUGS, type AcademyCourse } from '@/lib/academy'
import { ACADEMY_ANSWERS } from '@/lib/academy-answers'
import { courseImage } from '@/lib/academy-extras'
import { getCourseContent } from '@/lib/academy-content'
import type { CourseContent } from '@/lib/academy-types'
import {
  buildContentDoc,
  contentMinutes,
  contentToAnswerKey,
  contentToLessons,
  contentToQuiz,
  contentToRich,
  normaliseContent,
  validateContent,
  type AcademyContentDoc,
} from '@/lib/academy-course-content'
import { createAdminClient } from '@/lib/supabase/admin'

// The commercial fields an admin controls on every course, whoever authored
// the teaching content.
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

export type ContentSource = 'platform' | 'custom'

export type ManagedAcademyCourse = AcademyCourse & {
  image_url: string
  is_active: boolean
  is_core: boolean
  is_custom: boolean
  managed: boolean
  // True when the course is authored in code (src/lib/academy.ts plus its
  // content pack). Such a course always has a platform version to fall back to.
  code_defined: boolean
  sort_order: number | null
  // True when image_url came from an admin upload rather than the code default,
  // so public surfaces know an admin choice must not be second-guessed.
  image_admin_set: boolean
  // Where the teaching content above actually came from. 'platform' means the
  // code content, unchanged. 'custom' means the admin has taken editorial
  // control and the validated document in the database is being served.
  content_source: ContentSource
  // Set when the admin has taken control but the stored document does not
  // validate: the platform version is being served instead and the admin list
  // shows this as a warning.
  content_error: string | null
  // The rich course content (aims, objectives, sections, key terms, case
  // studies) when it comes from an admin-authored document. Null for a
  // platform course, which reads its rich content from code as it always has.
  rich: CourseContent | null
  // The raw academy_courses row behind this course, when one exists. Admin
  // surfaces use it to show exactly what has been overridden.
  override: AcademyCourseOverride | null
  // The admin-authored document itself. Admin-only: stripped by publicCourse
  // because it carries the assessment answer key.
  content_doc: AcademyContentDoc | null
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
  content_source?: string | null
  content?: unknown
}

// sort_order arrives with migration 20260901110000; content_source, content and
// content_updated_at with 20260901130000. Until each runs, reads simply see
// undefined (the platform content is served) and writes retry without the
// column.
function isMissingColumnError(error: { message?: string } | null | undefined) {
  return Boolean(error && /column/i.test(error.message || ''))
}

const OPTIONAL_COLUMNS = ['content', 'content_source', 'content_updated_at', 'sort_order'] as const

const cleanNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// --- The content decision -------------------------------------------------
// The one place that decides whether a database row may supply course content.
// Database content is served ONLY when the admin has explicitly taken
// editorial control (content_source = 'custom') AND the stored document passes
// the shared validator. A partial or empty document is refused here, so it can
// never reach a learner: the platform version is served instead and the reason
// is reported to the admin Academy list.
type ContentDecision = {
  source: ContentSource
  // The document actually served to learners: set only when the source is
  // 'custom' and the document validates.
  doc: AcademyContentDoc | null
  // The document as stored, whatever the source. Admin-only - this is what the
  // editor loads, so reverting to the platform version never loses writing.
  stored: AcademyContentDoc | null
  error: string | null
}

function decideContent(row: CourseRow | undefined | null): ContentDecision {
  const source: ContentSource = String(row?.content_source || 'platform') === 'custom' ? 'custom' : 'platform'
  const stored = row?.content ? normaliseContent(row.content) : null
  if (source !== 'custom') return { source: 'platform', doc: null, stored, error: null }
  if (!stored) {
    return { source: 'custom', doc: null, stored: null, error: 'This course is set to your own version, but no content has been saved yet. Learners are seeing the platform version.' }
  }
  const error = validateContent(stored)
  return { source: 'custom', doc: error ? null : stored, stored, error }
}

// Everything a validated document supplies. Nothing else in the merge may
// touch teaching content.
function contentFields(slug: string, doc: AcademyContentDoc, fallback: { tagline: string; category: AcademyCourse['category']; minutes: number }) {
  return {
    title: doc.title,
    tagline: doc.tagline || fallback.tagline,
    category: (doc.category || fallback.category) as AcademyCourse['category'],
    minutes: contentMinutes(doc) || fallback.minutes,
    lessons: contentToLessons(doc),
    quiz: contentToQuiz(doc),
    answer_key: contentToAnswerKey(doc),
    rich: contentToRich(slug, doc) as CourseContent,
  }
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
    content_source: 'platform',
    content_error: null,
    rich: null,
    override: null,
    content_doc: null,
    answer_key: ACADEMY_ANSWERS[course.slug] || [],
  }
}

// A course that exists only in the database (created by an admin). There is no
// platform version to fall back to, so its own columns are the source of truth
// until it has been given a content document.
function rowCourse(row: CourseRow): ManagedAcademyCourse {
  const decision = decideContent(row)
  const base: ManagedAcademyCourse = {
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
    content_source: decision.source,
    content_error: decision.error,
    rich: null,
    override: overrideOf(row),
    content_doc: decision.stored,
    answer_key: Array.isArray(row.answer_key) ? row.answer_key : [],
  }
  if (!decision.doc) return base
  return { ...base, ...contentFields(row.slug, decision.doc, { tagline: base.tagline, category: base.category, minutes: base.minutes }) }
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
  // The answer key and the admin document (which contains it) never leave the
  // server on a public surface.
  const { answer_key: _answerKey, override: _override, content_doc: _contentDoc, ...safe } = course
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
    // A course defined in code keeps its platform content unless the admin has
    // explicitly taken editorial control of it and the saved document passes
    // validation. The raw content columns on the row are never read here: the
    // only route from the database to a learner is a complete, validated
    // document. Everything else the row carries is commercial - price, image,
    // summary line, display order, visibility.
    const merged = base.map(course => {
      const row = overrides.get(course.slug)
      if (!row) return course
      const decision = decideContent(row)
      const tagline = String(row.tagline || '').trim()
      const settled: ManagedAcademyCourse = {
        ...course,
        tagline: tagline || course.tagline,
        price: cleanNumber(row.price) ?? course.price,
        image_url: row.image_url || course.image_url,
        image_admin_set: Boolean(row.image_url),
        is_active: row.is_active,
        sort_order: cleanNumber(row.sort_order),
        override: overrideOf(row),
        managed: true,
        content_source: decision.source,
        content_error: decision.error,
        content_doc: decision.stored,
      }
      if (!decision.doc) return settled
      return { ...settled, ...contentFields(course.slug, decision.doc, { tagline: settled.tagline, category: settled.category, minutes: settled.minutes }) }
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

// The rich content a course player should render: the admin's document when
// she has taken control, the code content pack otherwise.
export function academyRichContent(course: ManagedAcademyCourse | null, slug: string): CourseContent | null {
  return course?.rich || getCourseContent(slug)
}

// The platform version of a course, as an editable document. This is the
// starting copy "Take editorial control of this course" saves, so the admin
// never begins from an empty row.
export function platformContentDoc(course: ManagedAcademyCourse): AcademyContentDoc {
  const codeCourse = ACADEMY.find(entry => entry.slug === course.slug)
  const rich = getCourseContent(course.slug)
  const source = codeCourse
    ? {
        title: codeCourse.title,
        tagline: codeCourse.tagline,
        category: codeCourse.category as string,
        minutes: codeCourse.minutes,
        lessons: codeCourse.lessons,
        quiz: codeCourse.quiz,
        answerKey: ACADEMY_ANSWERS[course.slug] || [],
        rich,
      }
    : {
        // A database-only course: its own columns are its platform version.
        title: course.title,
        tagline: course.tagline,
        category: course.category as string,
        minutes: course.minutes,
        lessons: course.lessons,
        quiz: course.quiz,
        answerKey: course.answer_key || [],
        rich: course.rich,
      }
  return buildContentDoc(source)
}

// --- Writes ---------------------------------------------------------------

type UpsertResult = { error: string | null; dropped: string[] }

// The house try/retry-without-column pattern, generalised: if a migration has
// not run yet, the column it adds is dropped from the payload and the write is
// retried, so every save works before and after the database is updated. The
// caller is told which columns were dropped and reports it plainly.
async function upsertCourseRow(admin: ReturnType<typeof createAdminClient>, payload: Record<string, any>): Promise<UpsertResult> {
  const body: Record<string, any> = { ...payload }
  const dropped: string[] = []
  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt++) {
    const { error } = await admin.from('academy_courses').upsert(body, { onConflict: 'slug' })
    if (!error) return { error: null, dropped }
    if (!isMissingColumnError(error)) return { error: error.message, dropped }
    const named = OPTIONAL_COLUMNS.find(column => (error.message || '').includes(column) && column in body)
    const missing = named || OPTIONAL_COLUMNS.find(column => column in body)
    if (!missing) return { error: error.message, dropped }
    delete body[missing]
    dropped.push(missing)
  }
  return { error: 'Could not save this course.', dropped }
}

// Has migration 20260901130000 run? Used to refuse a content save with a clear
// message rather than appearing to save and changing nothing.
export async function academyContentColumnsReady(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.from('academy_courses').select('content_source').limit(1)
  return !(error && isMissingColumnError(error))
}

// Upsert the admin-editable settings for one course, creating the
// academy_courses row when the course has never been touched in admin. The
// content columns are seeded, never authored here.
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
    // Content columns are seeded from whatever the course currently is, so the
    // row is never left holding a stale or empty course. They are only ever
    // read back for a database-only course; a code course's content comes from
    // code unless a validated document says otherwise.
    title: course.title,
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

  const { error, dropped } = await upsertCourseRow(admin, payload)
  if (error) return { error }
  return { error: null, sortOrderSaved: !dropped.includes('sort_order') }
}

// Save the admin-authored document for one course. Validation happens before
// anything is written, so a document that would leave learners with an empty
// course is refused with a message naming the problem.
export async function saveAcademyCourseContent(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  doc: AcademyContentDoc,
  source: ContentSource,
  updatedBy: string,
) {
  const course = await getAcademyCourseBySlug(slug, true)
  if (!course) return { error: 'Course not found' }

  const problem = validateContent(doc)
  if (problem) return { error: problem }

  if (!(await academyContentColumnsReady(admin))) {
    return { error: 'The Academy content update has not been run on the database yet. Run supabase/migrations/20260901130000_academy_course_content.sql, then save again. Nothing has been changed.' }
  }

  const lessons = contentToLessons(doc)
  const payload: Record<string, any> = {
    slug: course.slug,
    title: doc.title,
    tagline: doc.tagline || course.tagline,
    category: doc.category || course.category,
    minutes: contentMinutes(doc) || course.minutes,
    price: course.price ?? 1000,
    image_url: course.override?.image_url ?? null,
    lessons,
    quiz: contentToQuiz(doc),
    answer_key: contentToAnswerKey(doc),
    is_active: course.is_active,
    is_core: course.is_core,
    is_custom: course.is_custom,
    sort_order: course.sort_order,
    content: doc,
    content_source: source,
    content_updated_at: new Date().toISOString(),
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }

  const { error, dropped } = await upsertCourseRow(admin, payload)
  if (error) return { error }
  if (dropped.includes('content') || dropped.includes('content_source')) {
    return { error: 'The Academy content update has not been run on the database yet, so your writing could not be stored. Run supabase/migrations/20260901130000_academy_course_content.sql and save again.' }
  }
  return { error: null, sortOrderSaved: !dropped.includes('sort_order') }
}

// Switch a course between the platform version and the admin's own version.
// Reverting keeps the stored document, so it is never destructive.
export async function setAcademyContentSource(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  source: ContentSource,
  updatedBy: string,
) {
  const course = await getAcademyCourseBySlug(slug, true)
  if (!course) return { error: 'Course not found' }
  if (!(await academyContentColumnsReady(admin))) {
    return { error: 'The Academy content update has not been run on the database yet. Run supabase/migrations/20260901130000_academy_course_content.sql, then try again.' }
  }
  if (source === 'custom') {
    const problem = validateContent(course.content_doc)
    if (problem) return { error: `Your version cannot go live yet: ${problem}` }
  }
  const { error } = await admin.from('academy_courses')
    .update({ content_source: source, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('slug', course.slug)
  return { error: error ? error.message : null }
}
