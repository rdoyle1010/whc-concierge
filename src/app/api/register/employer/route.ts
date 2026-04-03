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

    // Insert employer profile using service role (bypasses RLS)
    const { error: profileError } = await supabase
      .from('employer_profiles')
      .insert({ user_id: userId, ...profileData })

    if (profileError) {
      // Retry with minimal fields
      const { error: retryError } = await supabase
        .from('employer_profiles')
        .insert({
          user_id: userId,
          company_name: profileData.company_name,
          contact_name: profileData.contact_name,
          email: profileData.email || null,
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
