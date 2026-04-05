import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// -- Whitelists --
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
  'talent-documents',
])

export async function POST(req: NextRequest) {
  try {
    // -- Auth: caller must be logged in --
    const cookieStore = cookies()
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
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null
    const path = formData.get('path') as string | null
    const profileId = formData.get('profileId') as string | null
    const column = formData.get('column') as string | null

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing file, bucket, or path' }, { status: 400 })
    }

    // -- Validate bucket --
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // -- Validate column (if provided) --
    if (column && !ALLOWED_COLUMNS.has(column)) {
      return NextResponse.json({ error: 'Invalid column' }, { status: 400 })
    }

    // -- Ownership: if updating a profile, it must belong to the caller --
    const admin = createAdminClient()
    if (profileId) {
      const { data: profile } = await admin
        .from('candidate_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()

      if (!profile || profile.user_id !== user.id) {
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

    if (uploadError) {
      // Try site-images as fallback if primary bucket fails
      if (actualBucket !== 'site-images') {
        const { error: fallbackError } = await admin.storage
          .from('site-images')
          .upload(path, buffer, { upsert: true, contentType: file.type || 'application/octet-stream' })
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        const { data: { publicUrl } } = admin.storage.from('site-images').getPublicUrl(path)

        // Update profile if requested (column already validated)
        if (profileId && column) {
          await admin.from('candidate_profiles').update({ [column]: publicUrl }).eq('id', profileId)
        }

        return NextResponse.json({ url: publicUrl })
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(actualBucket).getPublicUrl(path)

    // Update profile record if requested (column already validated)
    if (profileId && column) {
      await admin.from('candidate_profiles').update({ [column]: publicUrl }).eq('id', profileId)
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
