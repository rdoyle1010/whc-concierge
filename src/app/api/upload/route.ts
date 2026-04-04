import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null
    const path = formData.get('path') as string | null
    const profileId = formData.get('profileId') as string | null
    const column = formData.get('column') as string | null

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Missing file, bucket, or path' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For profile photos, always use site-images (public bucket)
    const actualBucket = bucket === 'profile-photos' ? 'site-images' : bucket

    const { error: uploadError } = await supabase.storage
      .from(actualBucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) {
      // Try site-images as fallback if primary bucket fails
      if (actualBucket !== 'site-images') {
        const { error: fallbackError } = await supabase.storage
          .from('site-images')
          .upload(path, buffer, { upsert: true, contentType: file.type || 'application/octet-stream' })
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        const { data: { publicUrl } } = supabase.storage.from('site-images').getPublicUrl(path)

        // Update profile if requested
        if (profileId && column) {
          await supabase.from('candidate_profiles').update({ [column]: publicUrl }).eq('id', profileId)
        }

        return NextResponse.json({ url: publicUrl })
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(actualBucket).getPublicUrl(path)

    // Update profile record if requested (bypasses RLS)
    if (profileId && column) {
      await supabase.from('candidate_profiles').update({ [column]: publicUrl }).eq('id', profileId)
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
