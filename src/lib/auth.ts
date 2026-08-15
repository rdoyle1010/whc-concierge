import { createServerSupabaseClient } from './supabase/server'
import { redirect } from 'next/navigation'
import { normaliseAccountRole } from './role-access'

export type UserRole = 'talent' | 'employer' | 'admin'

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? { user } : null
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Check the profiles table first (single source of truth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = normaliseAccountRole(profile?.role)
  return role === 'candidate' ? 'talent' : role
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
