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

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (profile) return 'talent'

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (employer) return 'employer'

  // Check admin via user metadata or a separate admin table
  const meta = session.user.user_metadata
  if (meta?.role === 'admin') return 'admin'

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
