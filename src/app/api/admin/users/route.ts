import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { type, id, action, reason } = body as {
    type: 'candidate' | 'employer'
    id: string
    action: 'approve' | 'reject'
    reason?: string
  }

  if (!id || (type !== 'candidate' && type !== 'employer') || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const table = type === 'candidate' ? 'candidate_profiles' : 'employer_profiles'
  const update = action === 'approve'
    ? { approval_status: 'approved', approval_notes: null }
    : { approval_status: 'rejected', approval_notes: reason || null }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from(table)
    .update(update)
    .eq('id', id)
    .select('id, user_id, approval_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, profile: data })
}
