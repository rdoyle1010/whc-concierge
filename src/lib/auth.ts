import { createServerSupabaseClient } from './supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'talent' | 'employer' | 'admin'

export async function getSession() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // 1. Check the profiles table first (single source of truth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin') return 'admin'
  if (profile?.role === 'employer') return 'employer'
  if (profile?.role === 'candidate' || profile?.role === 'talent') return 'talent'

  // 2. Fallback: check user_metadata
  if (session.user.user_metadata?.role === 'admin') return 'admin'

  // 3. Fallback: check profile tables directly
  const { data: candidate } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (candidate) return 'talent'

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (employer) return 'employer'

  return null
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (allowedRoles) {
    const role = await getUserRole()
    if (!role || !allowedRoles.includes(role)) {
      redirect('/login')
    }
    return { session, role }
  }

  return { session, role: await getUserRole() }
}
