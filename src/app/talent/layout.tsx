import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Role gate: the talent area is for candidates (admins may pass for support).
// Stops an employer wandering into candidate pages - by link or by accident.
export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') redirect('/employer/dashboard')
  if (!profile || (profile.role !== 'candidate' && profile.role !== 'talent' && profile.role !== 'admin')) redirect('/login?error=unauthorised')

  return children
}
