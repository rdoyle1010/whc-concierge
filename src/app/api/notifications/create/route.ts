import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import type { NotificationType } from '@/lib/notifications'

// Creating a notification for another user (e.g. "you've been shortlisted")
// is legitimate, but ONLY for logged-in users, with a whitelisted type,
// bounded content, and internal links only. Anonymous callers are rejected.

const ALLOWED_TYPES: NotificationType[] = [
  'new_match', 'new_message', 'profile_approved', 'job_application', 'review_received', 'general',
]

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function POST(req: NextRequest) {
  try {
    // -- Auth: caller must be logged in --
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { userId, type, title, message, link } = await req.json()
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }
    if (typeof title !== 'string' || title.length > 200 || typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json({ error: 'Title or message too long' }, { status: 400 })
    }
    // Internal links only - no external URLs in notifications
    if (link && (typeof link !== 'string' || !link.startsWith('/') || link.startsWith('//'))) {
      return NextResponse.json({ error: 'Link must be an internal path' }, { status: 400 })
    }

    const { error } = await createNotification(userId, type as NotificationType, title, message, link)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
