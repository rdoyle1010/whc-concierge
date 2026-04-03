import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, profileData } = body

    if (!userId || !profileData) {
      return NextResponse.json({ error: 'Missing userId or profileData' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Insert candidate profile using service role (bypasses RLS)
    const { error: profileError } = await supabase
      .from('candidate_profiles')
      .insert({ user_id: userId, ...profileData })

    if (profileError) {
      // Retry with minimal fields if extended columns don't exist
      const { error: retryError } = await supabase
        .from('candidate_profiles')
        .insert({
          user_id: userId,
          full_name: profileData.full_name,
          phone: profileData.phone || null,
          bio: profileData.bio || null,
          headline: profileData.headline || null,
        })

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
