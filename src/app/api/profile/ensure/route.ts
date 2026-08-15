import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Find-or-create the candidate profile for the logged-in user. The onboarding
// wizard previously rendered with no profile row (e.g. when the registration
// profile insert had failed) and silently discarded every answer.
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()

    // Employers get bounced - this endpoint is for candidates only
    const { data: emp } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (emp) return NextResponse.json({ error: 'Employer accounts do not have a talent profile' }, { status: 403 })

    const { data: existing } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (existing) return NextResponse.json({ profileId: existing.id, created: false })

    const { data: created, error } = await admin
      .from('candidate_profiles')
      .insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        approval_status: 'pending',
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Keep the profiles table consistent (role routing depends on it)
    await admin.from('profiles').upsert(
      { id: user.id, email: user.email, role: 'candidate', full_name: user.user_metadata?.full_name || null },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    return NextResponse.json({ profileId: created.id, created: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
