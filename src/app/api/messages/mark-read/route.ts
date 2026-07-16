import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Marks a conversation read for the logged-in user. Service-role backed -
// the old client-side update was RLS-blocked, so unread badges never cleared.
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { partnerId } = await req.json()
    if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', user.id)
      .eq('sender_id', partnerId)
      .eq('read', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
