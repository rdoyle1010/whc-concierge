import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { markAsRead, markAllRead } from '@/lib/notifications'

const NOTIFICATION_FIELDS = 'id,type,title,message,link,is_read,created_at'

async function getAuthedUser() {
  const cookieStore = await cookies()
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

  const [feedResult, unreadResult] = await Promise.all([
    supabase
      .from('notifications')
      .select(NOTIFICATION_FIELDS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ])

  if (feedResult.error) {
    return NextResponse.json({ error: feedResult.error.message }, { status: 500 })
  }
  if (unreadResult.error) {
    return NextResponse.json({ error: unreadResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    notifications: feedResult.data || [],
    unreadCount: unreadResult.count || 0,
  })
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
      const { error } = await markAsRead(notificationId, user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'notificationId or markAll required' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
