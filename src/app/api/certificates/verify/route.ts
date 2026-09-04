import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Public certificate verification by exact code. Reveals only what the
// certificate itself states - name, course, date, hours, score. Rate
// limited so codes cannot be enumerated.

const limiter = rateLimit('certificate-verify', { windowMs: 10 * 60 * 1000, maxRequests: 30 })

export async function GET(req: NextRequest) {
  const { success } = limiter.check(getClientIp(req))
  if (!success) return NextResponse.json({ error: 'Too many checks - try again shortly.' }, { status: 429 })

  const code = String(req.nextUrl.searchParams.get('code') || '').trim()
  if (code.length < 6) return NextResponse.json({ certificate: null }, { status: 404 })

  const admin = createAdminClient()
  const { data: enrolment } = await admin.from('course_enrollments')
    .select('course_slug, quiz_score, completed_at, certificate_code, candidate_id')
    .eq('certificate_code', code)
    .not('completed_at', 'is', null)
    .maybeSingle()
  if (!enrolment) return NextResponse.json({ certificate: null }, { status: 404 })

  const [{ data: candidate }, course] = await Promise.all([
    admin.from('candidate_profiles').select('full_name').eq('id', enrolment.candidate_id).maybeSingle(),
    getAcademyCourseBySlug(enrolment.course_slug, true),
  ])

  return NextResponse.json({
    certificate: {
      code: enrolment.certificate_code,
      course_slug: enrolment.course_slug,
      learner_name: candidate?.full_name || 'Name unavailable',
      course_title: course?.title || enrolment.course_slug,
      completed_at: enrolment.completed_at,
      learning_minutes: course?.minutes || null,
      score: typeof enrolment.quiz_score === 'number' ? enrolment.quiz_score : null,
    },
  })
}
