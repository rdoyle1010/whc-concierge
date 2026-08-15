import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { verifyRegistrationProof } from '@/lib/registration'

// ── Whitelists ────────────────────────────────────────────────────────────
// Columns that may be written after an upload completes.
const ALLOWED_COLUMNS = new Set([
  'profile_image_url',
  'cv_url',
  'insurance_document_url',
])

// Storage buckets the client is allowed to target.
const ALLOWED_BUCKETS = new Set([
  'site-images',
  'profile-photos',
  'message-attachments',
  'talent-documents',
  'property-photos',
])

const PRIVATE_BUCKETS = new Set(['talent-documents', 'message-attachments'])

// File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_DOC_TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null
    const path = formData.get('path') as string | null
    const profileId = formData.get('profileId') as string | null
    const column = formData.get('column') as string | null
    const registrationUserId = formData.get('registrationUserId') as string | null
    const registrationProof = verifyRegistrationProof(formData.get('registrationProof'), {
      userId: registrationUserId || undefined,
      role: 'talent',
    })

    // ── Auth: caller must be logged in ──
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only in Route Handlers */ },
        },
      }
    )
    const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser()
    const effectiveUserId = sessionUser?.id || registrationProof?.sub
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing file, bucket, or path' }, { status: 400 })
    }

    // A short-lived registration proof can upload only the new talent user's
    // own private documents. It cannot write profile columns or public assets.
    if (!sessionUser && registrationProof && (bucket !== 'talent-documents' || profileId || column)) {
      return NextResponse.json({ error: 'Registration uploads are limited to private talent documents.' }, { status: 403 })
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    // ── Validate file type ──
    if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF, DOC, DOCX.' }, { status: 400 })
    }

    // ── Validate bucket ──
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // ── Validate column (if provided) ──
    if (column && !ALLOWED_COLUMNS.has(column)) {
      return NextResponse.json({ error: 'Invalid column' }, { status: 400 })
    }

    // ── Ownership: if updating a profile, it must belong to the caller ──
    const admin = createAdminClient()

    if (!sessionUser && registrationProof) {
      const { data: completedRegistration } = await admin
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', effectiveUserId)
        .maybeSingle()
      if (completedRegistration) {
        return NextResponse.json({ error: 'This registration proof has already been used.' }, { status: 409 })
      }
    }

    // Paths are ownership boundaries. Service-role storage writes bypass RLS,
    // so the route itself must never accept another user's path.
    if (path.startsWith('/') || path.includes('..') || path.includes('\\')) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 })
    }
    const [{ data: callerProfile }, { data: employerProfile }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', effectiveUserId).maybeSingle(),
      admin.from('employer_profiles').select('id').eq('user_id', effectiveUserId).maybeSingle(),
    ])
    const isAdmin = callerProfile?.role === 'admin'
    const isOwnUserPath = path === effectiveUserId || path.startsWith(`${effectiveUserId}/`)
    const isOwnEmployerAsset = Boolean(employerProfile && (
      path.startsWith(`${employerProfile.id}-`) || path.startsWith(`logos/${employerProfile.id}.`)
    ))
    if (!isAdmin && !isOwnUserPath && !isOwnEmployerAsset) {
      return NextResponse.json({ error: 'Upload path does not belong to this account' }, { status: 403 })
    }

    if (profileId) {
      const { data: profile } = await admin
        .from('candidate_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()

      if (!profile || profile.user_id !== effectiveUserId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For profile photos, always use site-images (public bucket)
    const actualBucket = bucket === 'profile-photos' ? 'site-images' : bucket

    const { error: uploadError } = await admin.storage
      .from(actualBucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const url = PRIVATE_BUCKETS.has(actualBucket)
      ? `/api/files?bucket=${encodeURIComponent(actualBucket)}&path=${encodeURIComponent(path)}`
      : admin.storage.from(actualBucket).getPublicUrl(path).data.publicUrl

    // Update profile record if requested (column already validated)
    if (profileId && column) {
      await admin.from('candidate_profiles').update({ [column]: url }).eq('id', profileId)
    }

    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
