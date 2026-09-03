import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { academyRichContent, getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { courseMeta } from '@/lib/academy-meta'
import { renderCourseManualPdf } from '@/lib/academy-manual-pdf'

// The Course Manual: a plain, professional PDF reference document generated
// from the course content, for enrolled learners. The digital course stays
// interactive; this is the printed-book take-away.

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const slug = String(req.nextUrl.searchParams.get('course') || '')
  if (!slug) return NextResponse.json({ error: 'Course is required.' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })
  const { data: enrolment } = await admin.from('course_enrollments')
    .select('paid_at').eq('candidate_id', candidate.id).eq('course_slug', slug)
    .not('paid_at', 'is', null).limit(1).maybeSingle()
  if (!enrolment) return NextResponse.json({ error: 'Paid course access required' }, { status: 403 })

  // The manual is generated from whatever the learner is actually studying:
  // the admin's own version when she has taken editorial control, the platform
  // content pack otherwise.
  const course = await getAcademyCourseBySlug(slug, true)
  const content = academyRichContent(course, slug)
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (!content) return NextResponse.json({ error: 'The manual for this course is being prepared.' }, { status: 404 })
  const meta = courseMeta(slug)

  try {
    const pdf = await renderCourseManualPdf({
      title: course.title,
      tagline: course.tagline || undefined,
      minutes: course.minutes,
      level: meta.level,
      cpdHours: meta.cpdHours,
      learnerName: candidate.full_name || 'the enrolled learner',
    }, content)

    const fileName = `Talent House-Course-Manual-${slug}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: any) {
    console.error('[Course manual] PDF generation failed:', error?.message)
    return NextResponse.json({ error: 'Could not generate the manual - please try again.' }, { status: 500 })
  }
}
