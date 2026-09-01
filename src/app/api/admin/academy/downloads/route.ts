import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAcademyCourseBySlug } from '@/lib/academy-catalog-server'

const BUCKET = 'academy-downloads'
const MAX_FILE_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
])

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 160)
  return cleaned || 'academy-download'
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('academy_download_resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resources: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  const courseSlug = String(form.get('courseSlug') || '').trim()
  const moduleValue = String(form.get('moduleIndex') || '').trim()
  const title = String(form.get('title') || '').trim().slice(0, 180)
  const description = String(form.get('description') || '').trim().slice(0, 500)

  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 })
  if (!courseSlug || !title) return NextResponse.json({ error: 'Choose a course and add a download title.' }, { status: 400 })
  if (file.size < 1 || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: 'Files must be 20 MB or smaller.' }, { status: 400 })
  if (file.type && !ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Use PDF, Word, Excel, CSV or text files.' }, { status: 400 })

  const course = await getAcademyCourseBySlug(courseSlug, true)
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })

  let moduleIndex: number | null = null
  if (moduleValue !== '') {
    moduleIndex = Number(moduleValue)
    if (!Number.isInteger(moduleIndex) || moduleIndex < 0 || moduleIndex >= course.lessons.length) {
      return NextResponse.json({ error: 'Choose a valid module.' }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const storedName = safeFileName(file.name)
  const storagePath = `${courseSlug}/${crypto.randomUUID()}-${storedName}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await admin.from('academy_download_resources').insert({
    course_slug: courseSlug,
    module_index: moduleIndex,
    title,
    description,
    storage_path: storagePath,
    file_name: file.name.slice(0, 255),
    mime_type: file.type || null,
    file_size: file.size,
    is_active: true,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  }).select('*').single()

  if (error) {
    await admin.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, resource: data })
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const id = String(req.nextUrl.searchParams.get('id') || '')
  if (!id) return NextResponse.json({ error: 'Missing download id.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: resource, error: findError } = await admin
    .from('academy_download_resources')
    .select('id,storage_path')
    .eq('id', id)
    .maybeSingle()
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 })
  if (!resource) return NextResponse.json({ error: 'Download not found.' }, { status: 404 })

  const { error: storageError } = await admin.storage.from(BUCKET).remove([resource.storage_path])
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })
  const { error: deleteError } = await admin.from('academy_download_resources').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
