import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { academyResource } from '@/lib/academy-resources'

export async function GET(req: NextRequest) {
  const course = String(req.nextUrl.searchParams.get('course') || '')
  const resourceId = String(req.nextUrl.searchParams.get('resource') || '')
  const resource = academyResource(course, resourceId)
  if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })

  const { data: enrollment } = await admin.from('course_enrollments')
    .select('paid_at')
    .eq('candidate_id', candidate.id)
    .eq('course_slug', course)
    .not('paid_at', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Paid programme access required' }, { status: 403 })

  return new NextResponse(resource.content, {
    headers: {
      'Content-Type': resource.contentType,
      'Content-Disposition': `attachment; filename="${resource.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
