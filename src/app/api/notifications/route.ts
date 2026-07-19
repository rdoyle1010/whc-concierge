import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { markAsRead, markAllRead } from '@/lib/notifications'

// The user id is ALWAYS derived from the authenticated session - never from
// a query param or the request body. Any userId passed by the client is ignored.

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function GET() {
  const { data: { user } } = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also return unread count
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ notifications: data || [], unreadCount: count || 0 })
}

export async function PATCH(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { notificationId, markAll } = await req.json()

    if (markAll) {
      const { error } = await markAllRead(user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      // Scoped to the caller's own notifications - cannot mark anyone else's read
      const { error } = await markAsRead(notificationId, user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'notificationId or markAll required' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
