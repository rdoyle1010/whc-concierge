import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendCourseGiftEmail } from '@/lib/emails'
import { getAcademyCatalog, getAcademyCourseBySlug, publicCourse } from '@/lib/academy-catalog-server'

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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  try {
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
    const courses = catalogue.map(course => {
      const courseRows = rows.filter((row: any) => row.course_slug === course.slug && row.paid_at)
      return {
        ...publicCourse(course),
        answer_key: course.answer_key,
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

    if (action === 'save_course') {
      const course = validateCourse(body.course || {})
      if ('error' in course) return NextResponse.json({ error: course.error }, { status: 400 })
      const existing = await getAcademyCourseBySlug(course.slug, true)
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
      return NextResponse.json({ success: true, slug: course.slug })
    }

    if (action === 'archive_course' || action === 'restore_course') {
      const slug = cleanSlug(body.courseSlug)
      const existing = await getAcademyCourseBySlug(slug, true)
      if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      const { error } = await admin.from('academy_courses').upsert({
        slug: existing.slug,
        title: existing.title,
        tagline: existing.tagline,
        category: existing.category,
        minutes: existing.minutes,
        price: existing.price ?? 1000,
        image_url: existing.image_url,
        lessons: existing.lessons,
        quiz: existing.quiz,
        answer_key: existing.answer_key || [],
        is_active: action === 'restore_course',
        is_core: existing.is_core,
        is_custom: existing.is_custom,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      if (error) throw error
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
          const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
          if (authUser?.user?.email) await sendCourseGiftEmail(authUser.user.email, candidate.full_name || 'there', course.title, false)
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
