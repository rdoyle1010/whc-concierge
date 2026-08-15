import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// This orphaned inbox predates the role-specific messaging pages; its send
// path silently failed (RLS-blocked client insert). It now just routes the
// visitor to the right inbox.
export default async function MessagesRedirect() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') redirect('/employer/messages')
  if (profile?.role === 'admin') redirect('/admin/messages')
  redirect('/talent/messages')
}
