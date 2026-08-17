import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const bookingId = String(req.nextUrl.searchParams.get('bookingId') || '').trim()
  if (!bookingId) return NextResponse.json({ error: 'Missing booking id.' }, { status: 400 })

  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('reviews')
    .select('id, created_at')
    .eq('reviewer_id', user.id)
    .eq('booking_id', bookingId)
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviewed: Boolean(data), reviewedAt: data?.created_at || null })
}
