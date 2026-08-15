import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Role gate: the employer area is for properties (admins may pass for support).
export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'candidate' || profile?.role === 'talent') redirect('/talent/dashboard')
  if (!profile || (profile.role !== 'employer' && profile.role !== 'admin')) redirect('/login?error=unauthorised')

  return children
}
