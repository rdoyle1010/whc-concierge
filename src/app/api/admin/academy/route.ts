import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendCourseGiftEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'
import {
  getAcademyCatalog,
  getAcademyCourseBySlug,
  platformContentDoc,
  publicCourse,
  saveAcademyCourseContent,
  saveAcademyCourseSettings,
  setAcademyContentSource,
} from '@/lib/academy-catalog-server'
import { courseMeta } from '@/lib/academy-meta'
import { publicCoursePrice } from '@/lib/academy'
import {
  buildContentDoc,
  contentStats,
  normaliseContent,
  validateContent,
} from '@/lib/academy-course-content'

const CATEGORIES = new Set(['Guest Experience', 'Standards', 'Treatments', 'Commercial', 'Brands', 'Specialist Care'])

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

function makeCertificateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = 'WHC-'
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

async function makeUniqueCertificateCode(admin: any) {
  let code = makeCertificateCode()
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin.from('course_enrollments').select('id').eq('certificate_code', code).maybeSingle()
    if (!clash) break
    code = makeCertificateCode()
  }
  return code
}

function cleanSlug(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function validateCourse(body: any) {
  const slug = cleanSlug(body.slug)
  const title = String(body.title || '').trim().slice(0, 140)
  const tagline = String(body.tagline || '').trim().slice(0, 300)
  const category = String(body.category || '')
  const minutes = Math.round(Number(body.minutes || 0))
  const price = Math.round(Number(body.price || 0))
  const imageUrl = String(body.image_url || '').trim().slice(0, 1000)
  const lessons = Array.isArray(body.lessons)
    ? body.lessons.map((lesson: any) => ({ title: String(lesson?.title || '').trim().slice(0, 180), content: String(lesson?.content || '').trim().slice(0, 30000) }))
    : []
  const quiz = Array.isArray(body.quiz)
    ? body.quiz.map((q: any) => ({ q: String(q?.q || '').trim().slice(0, 500), options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o || '').trim().slice(0, 500)) : [] }))
    : []
  const answerKey = Array.isArray(body.answer_key) ? body.answer_key.map((n: any) => Number(n)) : []

  if (!slug || !title || !tagline || !CATEGORIES.has(category)) return { error: 'Complete the course name, summary and category.' }
  if (minutes < 1 || minutes > 600 || price < 0 || price > 1000000) return { error: 'Check the course duration and price.' }
  if (!lessons.length || lessons.some((lesson: any) => !lesson.title || !lesson.content)) return { error: 'Add at least one complete module.' }
  if (!quiz.length || quiz.some((q: any) => !q.q || q.options.length < 2 || q.options.some((option: string) => !option))) return { error: 'Add at least one complete quiz question with answer choices.' }
  if (answerKey.length !== quiz.length || answerKey.some((answer: number, i: number) => !Number.isInteger(answer) || answer < 0 || answer >= quiz[i].options.length)) {
    return { error: 'Choose the correct answer for every quiz question.' }
  }
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return { error: 'Course image must use a secure https:// URL.' }
  return { slug, title, tagline, category, minutes, price, imageUrl, lessons, quiz, answerKey }
}

// One course, with its editable document, for the content editor.
async function courseDetail(slug: string) {
  const course = await getAcademyCourseBySlug(slug, true)
  if (!course) return null
  const meta = courseMeta(course.slug)
  return {
    course: {
      ...publicCourse(course),
      answer_key: course.answer_key,
      override: course.override,
      level: meta.level,
      cpd_hours: meta.cpdHours,
      member_price: course.price ?? 0,
      guest_price: publicCoursePrice(course),
    },
    content: course.content_doc,
    content_source: course.content_source,
    content_error: course.content_error,
    // What the platform version currently is, so the editor can say plainly
    // what "take editorial control" would copy in.
    platform_stats: contentStats(platformContentDoc(course)),
  }
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  try {
    const single = cleanSlug(req.nextUrl.searchParams.get('slug') || '')
    if (single) {
      const detail = await courseDetail(single)
      return detail
        ? NextResponse.json(detail)
        : NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    const catalogue = await getAcademyCatalog(true)
    const { data: enrolments, error: enrolError } = await admin.from('course_enrollments').select('*').order('created_at', { ascending: false })
    if (enrolError) throw enrolError
    const candidateIds = Array.from(new Set((enrolments || []).map((enrolment: any) => enrolment.candidate_id)))
    const { data: candidates } = candidateIds.length
      ? await admin.from('candidate_profiles').select('id, full_name, user_id').in('id', candidateIds)
      : { data: [] as any[] }
    const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.id, candidate]))
    const courseMap = new Map(catalogue.map(course => [course.slug, course]))
    const rows = (enrolments || []).map((enrolment: any) => ({
      ...enrolment,
      candidate_name: (candidateMap.get(enrolment.candidate_id) as any)?.full_name || 'Therapist',
      course_title: courseMap.get(enrolment.course_slug)?.title || enrolment.course_slug,
      lessons_total: courseMap.get(enrolment.course_slug)?.lessons.length ?? 0,
      lessons_done: Object.keys(enrolment.progress || {}).length,
    }))
    // Every course talent can see - the code catalogue merged with any
    // academy_courses overrides - with the same {revenue, enrolments,
    // completions} stat shape the agency dashboard reports.
    const courses = catalogue.map(course => {
      const courseRows = rows.filter((row: any) => row.course_slug === course.slug && row.paid_at)
      const meta = courseMeta(course.slug)
      return {
        ...publicCourse(course),
        answer_key: course.answer_key,
        override: course.override,
        level: meta.level,
        cpd_hours: meta.cpdHours,
        skills: meta.skills,
        modules: course.lessons.length,
        questions: course.quiz.length,
        member_price: course.price ?? 0,
        guest_price: publicCoursePrice(course),
        content_source: course.content_source,
        content_error: course.content_error,
        // Whether a saved document exists at all, so the list can offer
        // "publish your version" after a revert without shipping the document
        // itself (it carries the answer key).
        has_saved_content: Boolean(course.content_doc),
        enrolments: courseRows.length,
        completions: courseRows.filter((row: any) => row.completed_at).length,
        revenue: courseRows.reduce((sum: number, row: any) => sum + (row.amount_paid || 0), 0),
      }
    })
    const { data: approvedCandidates } = await admin.from('candidate_profiles').select('id, full_name').eq('approval_status', 'approved').order('full_name')
    return NextResponse.json({ enrollments: rows, courses, candidates: approvedCandidates || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  try {
    const body = await req.json()
    const action = String(body.action || '')

    // The safe control surface: works for every course in the catalogue,
    // including the ones defined in code, and never touches lesson content.
    if (action === 'save_course_settings') {
      const slug = cleanSlug(body.slug || body.courseSlug)
      const existing = await getAcademyCourseBySlug(slug, true)
      if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

      const price = Math.round(Number(body.price))
      if (!Number.isFinite(price) || price < 0 || price > 1000000) {
        return NextResponse.json({ error: 'Enter a member price between £0 and £10,000.' }, { status: 400 })
      }
      const imageUrl = String(body.image_url ?? '').trim().slice(0, 1000)
      if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
        return NextResponse.json({ error: 'Course image must use a secure https:// URL.' }, { status: 400 })
      }
      const tagline = String(body.tagline ?? '').trim().slice(0, 300)
      const sortRaw = body.sort_order
      const sortOrder = sortRaw === '' || sortRaw === null || sortRaw === undefined ? null : Math.round(Number(sortRaw))
      if (sortOrder !== null && (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999)) {
        return NextResponse.json({ error: 'Display order must be a whole number between 0 and 9999.' }, { status: 400 })
      }

      const result = await saveAcademyCourseSettings(admin, slug, {
        price,
        image_url: imageUrl || null,
        is_active: body.is_active !== false,
        tagline: tagline || null,
        sort_order: sortOrder,
      }, user.id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true, slug, sort_order_saved: result.sortOrderSaved !== false })
    }

    // --- Editorial control of course content -----------------------------
    // Taking control COPIES the full current platform content into the course
    // document first, so the admin always starts from a complete working copy
    // and an empty row can never replace a good course.
    if (action === 'take_content_control') {
      const slug = cleanSlug(body.slug || body.courseSlug)
      const course = await getAcademyCourseBySlug(slug, true)
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const doc = course.content_doc && !validateContent(course.content_doc)
        ? course.content_doc
        : platformContentDoc(course)
      const problem = validateContent(doc)
      if (problem) {
        return NextResponse.json({ error: `The platform version of this course could not be copied: ${problem}` }, { status: 400 })
      }
      const result = await saveAcademyCourseContent(admin, slug, doc, 'custom', user.id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, slug, content: doc, content_source: 'custom' })
    }

    if (action === 'save_content') {
      const slug = cleanSlug(body.slug || body.courseSlug)
      const course = await getAcademyCourseBySlug(slug, true)
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const doc = normaliseContent(body.content)
      // The same validator the editor runs, so nothing can be saved here that
      // the editor would have refused.
      const problem = validateContent(doc)
      if (problem) return NextResponse.json({ error: problem }, { status: 400 })
      const source = body.publish === false ? course.content_source : 'custom'
      const result = await saveAcademyCourseContent(admin, slug, doc, source, user.id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, slug, content_source: source, stats: contentStats(doc) })
    }

    // Reverting is not destructive: the document stays in the database and can
    // be published again.
    if (action === 'revert_content' || action === 'publish_content') {
      const slug = cleanSlug(body.slug || body.courseSlug)
      const source = action === 'publish_content' ? 'custom' : 'platform'
      const result = await setAcademyContentSource(admin, slug, source, user.id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, slug, content_source: source })
    }

    if (action === 'save_course') {
      const course = validateCourse(body.course || {})
      if ('error' in course) return NextResponse.json({ error: course.error }, { status: 400 })
      const existing = await getAcademyCourseBySlug(course.slug, true)
      // A platform course is edited through the content editor, which copies
      // the code content in first. Writing raw columns here would look like it
      // worked and change nothing for learners - so it is refused, plainly.
      if (existing?.code_defined) {
        return NextResponse.json({
          error: 'This is a platform course. Open it in the course content editor and choose "Take editorial control of this course" - that copies the current WHC content in for you to edit, so nothing is ever lost.',
        }, { status: 400 })
      }
      const { error } = await admin.from('academy_courses').upsert({
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        category: course.category,
        minutes: course.minutes,
        price: course.price,
        image_url: course.imageUrl || null,
        lessons: course.lessons,
        quiz: course.quiz,
        answer_key: course.answerKey,
        is_active: true,
        is_core: Boolean(body.course?.is_core),
        is_custom: existing ? existing.is_custom : true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      if (error) throw error
      // A course created here is immediately a full editorial document, so the
      // content editor (modules, lessons, key terms, knowledge checks) works on
      // it straight away. Best-effort: if the content migration has not run,
      // the course still exists and is served from its own columns.
      const doc = buildContentDoc({
        title: course.title,
        tagline: course.tagline,
        category: course.category,
        minutes: course.minutes,
        lessons: course.lessons,
        quiz: course.quiz,
        answerKey: course.answerKey,
        rich: null,
      })
      const contentResult = validateContent(doc) ? { error: null } : await saveAcademyCourseContent(admin, course.slug, doc, 'custom', user.id)
      return NextResponse.json({ success: true, slug: course.slug, content_saved: !contentResult.error })
    }

    if (action === 'archive_course' || action === 'restore_course') {
      const slug = cleanSlug(body.courseSlug)
      const existing = await getAcademyCourseBySlug(slug, true)
      if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const result = await saveAcademyCourseSettings(admin, slug, {
        price: existing.price ?? 1000,
        image_url: existing.override?.image_url ?? null,
        is_active: action === 'restore_course',
        tagline: existing.override?.tagline ?? null,
        sort_order: existing.sort_order,
      }, user.id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'grant') {
      const course = await getAcademyCourseBySlug(cleanSlug(body.courseSlug), false)
      if (!course) return NextResponse.json({ error: 'Unknown or archived course' }, { status: 400 })
      const { data: candidate } = await admin.from('candidate_profiles').select('id, user_id, full_name').eq('id', String(body.candidateId || '')).maybeSingle()
      if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      const { error } = await admin.from('course_enrollments').upsert(
        { candidate_id: candidate.id, course_slug: course.slug, paid_at: new Date().toISOString(), amount_paid: 0 },
        { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
      )
      if (error) throw error
      try {
        if (candidate.user_id) {
          await createNotification(candidate.user_id, 'general', 'A course has been unlocked for you', `Wellness House Collective has enrolled you on ${course.title}, with our compliments.`, '/talent/academy')
          // Preference-gated ('academy_updates'): the gifted-course email is an
          // Academy notification; the in-app notification above always fires
          // so the gift is never invisible. Fail-open on lookup errors.
          if (await emailAllowed(admin, candidate.user_id, 'academy_updates')) {
            const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
            if (authUser?.user?.email) await sendCourseGiftEmail(authUser.user.email, candidate.full_name || 'there', course.title, false)
          }
        }
      } catch { /* best effort */ }
      return NextResponse.json({ success: true })
    }

    const { data: enrolment } = await admin.from('course_enrollments').select('*').eq('id', String(body.id || '')).maybeSingle()
    if (!enrolment) return NextResponse.json({ error: 'Enrolment not found' }, { status: 404 })
    const { data: candidate } = await admin.from('candidate_profiles').select('id, user_id, full_name').eq('id', enrolment.candidate_id).maybeSingle()
    const course = await getAcademyCourseBySlug(enrolment.course_slug, true)

    if (action === 'award') {
      if (enrolment.completed_at) return NextResponse.json({ error: 'Already certified.' }, { status: 400 })
      const { error } = await admin.from('course_enrollments').update({ completed_at: new Date().toISOString(), certificate_code: await makeUniqueCertificateCode(admin), quiz_score: enrolment.quiz_score ?? 100 }).eq('id', enrolment.id)
      if (error) throw error
      try {
        if (candidate?.user_id) await createNotification(candidate.user_id, 'general', 'Certificate awarded', `WHC has awarded you the certificate for ${course?.title || enrolment.course_slug}.`, '/talent/academy')
      } catch { /* best effort */ }
      return NextResponse.json({ success: true })
    }

    if (action === 'revoke') {
      const { error } = await admin.from('course_enrollments').update({ completed_at: null, certificate_code: null }).eq('id', enrolment.id)
      if (error) throw error
      try {
        if (candidate?.user_id) await createNotification(candidate.user_id, 'general', 'Certificate withdrawn', `Your certificate for ${course?.title || enrolment.course_slug} has been withdrawn by WHC${body.reason ? `: ${String(body.reason).slice(0, 300)}` : ''}.`, '/talent/academy')
      } catch { /* best effort */ }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
