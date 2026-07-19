import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { courseBySlug, PASS_MARK } from '@/lib/academy'
import { ACADEMY_ANSWERS } from '@/lib/academy-answers'

// WHC Academy - enrolments, lesson progress and the server-graded quiz.
// Payment happens via /api/stripe/checkout (type 'course'); the webhook sets
// paid_at. Quizzes are graded HERE so answer keys never reach the browser.

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

function makeCertificateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = 'WHC-'
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id, full_name').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const { data: rows, error } = await admin.from('course_enrollments')
      .select('*').eq('candidate_id', cand.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enrollments: rows || [], candidate_name: cand.full_name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles').select('id, full_name, user_id').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const body = await req.json()
    const action = String(body.action || '')
    const slug = String(body.courseSlug || '')
    const course = courseBySlug(slug)
    if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })

    const { data: enrolment } = await admin.from('course_enrollments')
      .select('*').eq('candidate_id', cand.id).eq('course_slug', slug).maybeSingle()
    if (!enrolment || !enrolment.paid_at) {
      return NextResponse.json({ error: 'You are not enrolled on this course yet.' }, { status: 403 })
    }

    // ── progress: tick a lesson as read ──
    if (action === 'progress') {
      const idx = parseInt(String(body.lesson), 10)
      if (isNaN(idx) || idx < 0 || idx >= course.lessons.length) {
        return NextResponse.json({ error: 'Invalid lesson' }, { status: 400 })
      }
      const progress = { ...(enrolment.progress || {}), [idx]: true }
      const { error } = await admin.from('course_enrollments')
        .update({ progress }).eq('id', enrolment.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, progress })
    }

    // ── quiz: grade server-side, award the certificate at 80%+ ──
    if (action === 'quiz') {
      const key = ACADEMY_ANSWERS[slug]
      if (!key) return NextResponse.json({ error: 'Quiz unavailable' }, { status: 500 })
      const answers = Array.isArray(body.answers) ? body.answers.map((a: any) => parseInt(String(a), 10)) : []
      if (answers.length !== key.length) {
        return NextResponse.json({ error: 'Please answer every question.' }, { status: 400 })
      }
      const correct = key.reduce((n, k, i) => n + (answers[i] === k ? 1 : 0), 0)
      const score = Math.round((correct / key.length) * 100)
      const passed = score >= PASS_MARK

      const update: Record<string, any> = {
        quiz_score: Math.max(score, enrolment.quiz_score || 0),
      }
      if (passed && !enrolment.completed_at) {
        update.completed_at = new Date().toISOString()
        update.certificate_code = makeCertificateCode()
      }
      const { data: updated, error } = await admin.from('course_enrollments')
        .update(update).eq('id', enrolment.id).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      if (passed && !enrolment.completed_at) {
        try {
          await createNotification(user.id, 'general', 'Course complete - certificate earned',
            `Congratulations - you passed ${course.title} with ${score}%. Your certificate is ready, and the badge now shows on your profile for employers to see.`,
            '/talent/academy')
        } catch { /* non-fatal */ }
      }

      return NextResponse.json({
        success: true,
        score,
        passed,
        correct,
        total: key.length,
        certificate_code: updated.certificate_code || null,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
