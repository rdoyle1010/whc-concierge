import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendCourseGiftEmail } from '@/lib/emails'
import { ACADEMY, courseBySlug } from '@/lib/academy'

// Admin command of the WHC Academy: every learner, every course, revenue,
// and full control - grant a course free, award a certificate manually
// (e.g. training delivered in person), or revoke one.

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
  if (profile?.role !== 'admin') return null
  return user
}

function makeCertificateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = 'WHC-'
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

// Random codes can collide; check the table before accepting one so the
// /verify lookup (maybeSingle) never finds two rows for the same code.
async function makeUniqueCertificateCode(admin: any) {
  let code = makeCertificateCode()
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin.from('course_enrollments')
      .select('id').eq('certificate_code', code).maybeSingle()
    if (!clash) break
    code = makeCertificateCode()
  }
  return code
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const { data: enrols } = await admin.from('course_enrollments')
      .select('*').order('created_at', { ascending: false })
    const candIds = Array.from(new Set((enrols || []).map((e: any) => e.candidate_id)))
    const { data: cands } = candIds.length
      ? await admin.from('candidate_profiles').select('id, full_name, user_id').in('id', candIds)
      : { data: [] as any[] }
    const candMap = new Map((cands || []).map((c: any) => [c.id, c]))

    const rows = (enrols || []).map((e: any) => ({
      ...e,
      candidate_name: candMap.get(e.candidate_id)?.full_name || 'Therapist',
      lessons_total: courseBySlug(e.course_slug)?.lessons.length ?? 0,
      lessons_done: Object.keys(e.progress || {}).length,
    }))

    // Per-course stats across the catalogue (including courses with no sales)
    const courses = ACADEMY.map(c => {
      const mine = rows.filter((r: any) => r.course_slug === c.slug && r.paid_at)
      return {
        slug: c.slug,
        title: c.title,
        category: c.category,
        enrolments: mine.length,
        completions: mine.filter((r: any) => r.completed_at).length,
        revenue: mine.reduce((s: number, r: any) => s + (r.amount_paid || 0), 0),
      }
    })

    // All approved candidates, for the "enrol a therapist" tool
    const { data: allCands } = await admin.from('candidate_profiles')
      .select('id, full_name').eq('approval_status', 'approved').order('full_name')

    return NextResponse.json({ enrollments: rows, courses, candidates: allCands || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const body = await req.json()
    const action = String(body.action || '')

    // ── grant: enrol a therapist free of charge (comp / push through) ──
    if (action === 'grant') {
      const course = courseBySlug(String(body.courseSlug || ''))
      if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })
      const { data: cand } = await admin.from('candidate_profiles')
        .select('id, user_id, full_name').eq('id', String(body.candidateId || '')).maybeSingle()
      if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

      const { error } = await admin.from('course_enrollments').upsert(
        { candidate_id: cand.id, course_slug: course.slug, paid_at: new Date().toISOString(), amount_paid: 0 },
        { onConflict: 'candidate_id,course_slug', ignoreDuplicates: true }
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      try {
        if (cand.user_id) {
          await createNotification(cand.user_id, 'general', 'A course has been unlocked for you',
            `Wellness House Collective has enrolled you on ${course.title}, with our compliments. Find it under Academy - complete it to earn the certificate and profile badge.`, '/talent/academy')
          const { data: u } = await admin.auth.admin.getUserById(cand.user_id)
          if (u?.user?.email) await sendCourseGiftEmail(u.user.email, cand.full_name || 'there', course.title, false)
        }
      } catch { /* non-fatal */ }
      return NextResponse.json({ success: true })
    }

    // ── The remaining actions operate on an existing enrolment ──
    const { data: enr } = await admin.from('course_enrollments')
      .select('*').eq('id', String(body.id || '')).maybeSingle()
    if (!enr) return NextResponse.json({ error: 'Enrolment not found' }, { status: 404 })
    const { data: cand } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name').eq('id', enr.candidate_id).maybeSingle()
    const course = courseBySlug(enr.course_slug)

    // ── award: certify manually (training verified outside the quiz) ──
    if (action === 'award') {
      if (enr.completed_at) return NextResponse.json({ error: 'Already certified.' }, { status: 400 })
      const { error } = await admin.from('course_enrollments')
        .update({ completed_at: new Date().toISOString(), certificate_code: await makeUniqueCertificateCode(admin), quiz_score: enr.quiz_score ?? 100 })
        .eq('id', enr.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      try {
        if (cand?.user_id) {
          await createNotification(cand.user_id, 'general', 'Certificate awarded',
            `Wellness House Collective has awarded you the certificate for ${course?.title || enr.course_slug}. It is live on your profile now.`, '/talent/academy')
          const { data: u } = await admin.auth.admin.getUserById(cand.user_id)
          if (u?.user?.email) await sendCourseGiftEmail(u.user.email, cand.full_name || 'there', course?.title || enr.course_slug, true)
        }
      } catch { /* non-fatal */ }
      return NextResponse.json({ success: true })
    }

    // ── revoke: withdraw a certificate (kept enrolled, badge removed) ──
    if (action === 'revoke') {
      const { error } = await admin.from('course_enrollments')
        .update({ completed_at: null, certificate_code: null })
        .eq('id', enr.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      try {
        if (cand?.user_id) await createNotification(cand.user_id, 'general', 'Certificate withdrawn',
          `Your certificate for ${course?.title || enr.course_slug} has been withdrawn by WHC${body.reason ? `: ${String(body.reason).slice(0, 300)}` : ''}. You can retake the quiz from the Academy at any time.`, '/talent/academy')
      } catch { /* non-fatal */ }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
