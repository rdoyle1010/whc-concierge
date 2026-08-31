import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getAcademyCatalog } from '@/lib/academy-catalog-server'
import { academyResources } from '@/lib/academy-resources'

// My Toolkit: every tool, template and download a learner has earned
// through their paid Academy courses, in one permanent place.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  const { data: enrolments } = await admin.from('course_enrollments')
    .select('course_slug,paid_at,completed_at').eq('candidate_id', candidate.id).not('paid_at', 'is', null)
  const slugs = Array.from(new Set((enrolments || []).map(enrolment => enrolment.course_slug)))
  if (!slugs.length) return NextResponse.json({ courses: [] })

  const catalog = await getAcademyCatalog(true)
  const titleFor = new Map(catalog.map(course => [course.slug, course.title]))

  const { data: uploads } = await admin.from('academy_download_resources')
    .select('id,course_slug,title,description,file_name,mime_type,file_size')
    .in('course_slug', slugs).eq('is_active', true)
    .order('created_at', { ascending: true })

  const courses = slugs.map(slug => {
    const builtIn = academyResources(slug).map(resource => ({
      kind: 'built_in' as const,
      id: resource.id,
      title: resource.title,
      description: resource.description,
      href: `/api/academy/resource?course=${encodeURIComponent(slug)}&resource=${encodeURIComponent(resource.id)}`,
    }))
    const uploaded = (uploads || []).filter(upload => upload.course_slug === slug).map(upload => ({
      kind: 'uploaded' as const,
      id: upload.id,
      title: upload.title,
      description: upload.description || '',
      file_name: upload.file_name,
      href: `/api/academy/uploads?course=${encodeURIComponent(slug)}&id=${encodeURIComponent(upload.id)}`,
    }))
    return {
      slug,
      title: titleFor.get(slug) || slug,
      completed: Boolean((enrolments || []).find(enrolment => enrolment.course_slug === slug)?.completed_at),
      resources: [...uploaded, ...builtIn],
    }
  }).filter(course => course.resources.length > 0)

  return NextResponse.json({ courses })
}
