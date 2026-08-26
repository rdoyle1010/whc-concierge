import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getRequestUser(req: NextRequest) {
  const authorization = req.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (bearer) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data: { user } } = await supabase.auth.getUser(bearer)
    return user || null
  }

  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  return user || null
}
