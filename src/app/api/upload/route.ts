import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRegistrationProof } from '@/lib/registration'
import { getRequestUser } from '@/lib/request-user'
import sharp from 'sharp'

// Nothing on this platform ever resized an uploaded picture. A property
// photographs its spa on a phone, uploads eight megapixels of it, and every
// visitor on 4G downloads the lot - at full resolution, in the original
// format, to be drawn in a box a few hundred pixels wide. That is most of why
// the site feels slow, and it compounds with every photo anyone adds.
//
// 2400px wide is generous: it still looks sharp on a retina display at full
// bleed, and it is an order of magnitude less data than a modern camera roll.
const MAX_IMAGE_WIDTH = 2400
// SVG is already small and rasterising it would throw away the thing that
// makes it worth using. GIFs may be animated, and sharp would flatten them.
const SKIP_RESIZE = new Set(['image/svg+xml', 'image/gif'])

async function shrinkImage(buffer: Buffer, type: string): Promise<Buffer> {
  if (!type.startsWith('image/') || SKIP_RESIZE.has(type)) return buffer
  try {
    const image = sharp(buffer, { failOn: 'none' })
    const { width } = await image.metadata()
    // rotate() applies the EXIF orientation and drops the tag, so a photo
    // taken sideways on a phone is not served sideways.
    let pipeline = image.rotate()
    if (width && width > MAX_IMAGE_WIDTH) pipeline = pipeline.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    const out = type === 'image/png'
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    // Never hand back something larger than we were given.
    return out.length < buffer.length ? out : buffer
  } catch {
    // A picture that sharp cannot read is still the person's picture. Store
    // the original rather than failing their upload over an optimisation.
    return buffer
  }
}

const ALLOWED_COLUMNS = new Set([
  'profile_image_url',
  'cv_url',
  'insurance_document_url',
])

const ALLOWED_BUCKETS = new Set([
  'site-images',
  'profile-photos',
  'message-attachments',
  'talent-documents',
  'property-photos',
])

const PRIVATE_BUCKETS = new Set(['talent-documents', 'message-attachments'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
// Advert creative is the one thing on this platform that is legitimately a
// video, and a 10 MB cap would refuse almost every one. Only an administrator
// can write to site-images, and only advert creative uses this ceiling.
const MAX_VIDEO_SIZE = 60 * 1024 * 1024
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...ALLOWED_VIDEO_TYPES,
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

    const sessionUser = await getRequestUser(req)
    const effectiveUserId = sessionUser?.id || registrationProof?.sub
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    if (!file || !bucket || !path) return NextResponse.json({ error: 'Missing file, bucket, or path' }, { status: 400 })

    if (!sessionUser && registrationProof && (bucket !== 'talent-documents' || profileId || column)) {
      return NextResponse.json({ error: 'Registration uploads are limited to private talent documents.' }, { status: 403 })
    }

    const isVideo = Boolean(file.type && ALLOWED_VIDEO_TYPES.has(file.type))
    const sizeLimit = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE
    if (file.size > sizeLimit) {
      return NextResponse.json({ error: `File too large. Maximum size is ${Math.round(sizeLimit / (1024 * 1024))} MB.` }, { status: 400 })
    }
    if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed. Accepted: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, PDF, DOC, DOCX.' }, { status: 400 })
    }
    // Video belongs only in advert creative, which lives in the public
    // site-images bucket and is writable by administrators alone.
    if (isVideo && bucket !== 'site-images') {
      return NextResponse.json({ error: 'Video can only be uploaded as advert creative.' }, { status: 400 })
    }
    if (!ALLOWED_BUCKETS.has(bucket)) return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    if (column && !ALLOWED_COLUMNS.has(column)) return NextResponse.json({ error: 'Invalid column' }, { status: 400 })

    const admin = createAdminClient()
    if (!sessionUser && registrationProof) {
      const { data: completedRegistration } = await admin.from('candidate_profiles').select('id').eq('user_id', effectiveUserId).maybeSingle()
      if (completedRegistration) return NextResponse.json({ error: 'This registration proof has already been used.' }, { status: 409 })
    }

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
      path.startsWith(`${employerProfile.id}-`) ||
      path.startsWith(`logos/${employerProfile.id}.`) ||
      path.startsWith(`logos/${employerProfile.id}-`) ||
      path.startsWith(`jobs/${employerProfile.id}/`)
    ))
    if (!isAdmin && !isOwnUserPath && !isOwnEmployerAsset) {
      return NextResponse.json({ error: 'Upload path does not belong to this account' }, { status: 403 })
    }

    if (profileId) {
      const { data: profile } = await admin.from('candidate_profiles').select('user_id').eq('id', profileId).single()
      if (!profile || profile.user_id !== effectiveUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const original = Buffer.from(await file.arrayBuffer())
    const buffer = await shrinkImage(original, file.type || '')
    const actualBucket = bucket === 'profile-photos' ? 'site-images' : bucket
    const { error: uploadError } = await admin.storage.from(actualBucket).upload(path, buffer, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
      // Every upload path in the app is timestamped, so a replacement is a new
      // URL and this can be cached hard rather than for Supabase's default hour.
      cacheControl: '31536000',
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const url = PRIVATE_BUCKETS.has(actualBucket)
      ? `/api/files?bucket=${encodeURIComponent(actualBucket)}&path=${encodeURIComponent(path)}`
      : admin.storage.from(actualBucket).getPublicUrl(path).data.publicUrl

    if (profileId && column) await admin.from('candidate_profiles').update({ [column]: url }).eq('id', profileId)
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
