import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function AdminLayout({
      children,
}: {
      children: React.ReactNode
}) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
          redirect('/login')
  }

  // Check the profiles table for admin role
  const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

  if (!profile || profile.role !== 'admin') {
          redirect('/login?error=unauthorised')
  }

  return children
}
