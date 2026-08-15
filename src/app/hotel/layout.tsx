import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// The legacy hotel URLs are employer-only. Keep this server-side gate even
// though the pages also load employer data in the browser.
export default async function HotelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?role=employer')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'candidate' || profile?.role === 'talent') redirect('/talent/dashboard')
  if (!profile || (profile.role !== 'employer' && profile.role !== 'admin')) redirect('/login?error=unauthorised')

  return children
}
