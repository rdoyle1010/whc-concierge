import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// Admin-uploaded course downloads, served to enrolled learners.
// GET ?course=slug            -> list active uploads for the course
// GET ?course=slug&id=<uuid>  -> redirect to a short-lived signed URL

const BUCKET = 'academy-downloads'

export async function GET(req: NextRequest) {
  const course = String(req.nextUrl.searchParams.get('course') || '')
  const id = String(req.nextUrl.searchParams.get('id') || '')
  if (!course) return NextResponse.json({ error: 'Course is required.' }, { status: 400 })

  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })

  const { data: enrollment } = await admin.from('course_enrollments')
    .select('paid_at').eq('candidate_id', candidate.id).eq('course_slug', course)
    .not('paid_at', 'is', null).limit(1).maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Paid programme access required' }, { status: 403 })

  if (id) {
    const { data: resource } = await admin.from('academy_download_resources')
      .select('id,storage_path,file_name').eq('id', id).eq('course_slug', course).eq('is_active', true).maybeSingle()
    if (!resource) return NextResponse.json({ error: 'Download not found.' }, { status: 404 })
    const { data: signed, error } = await admin.storage.from(BUCKET)
      .createSignedUrl(resource.storage_path, 600, { download: resource.file_name || true })
    if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Could not prepare the download.' }, { status: 500 })
    return NextResponse.redirect(signed.signedUrl)
  }

  const { data: rows, error } = await admin.from('academy_download_resources')
    .select('id,title,description,module_index,file_name,mime_type,file_size,created_at')
    .eq('course_slug', course).eq('is_active', true)
    .order('module_index', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ resources: [] })
  return NextResponse.json({ resources: rows || [] })
}
