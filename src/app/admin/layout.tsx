import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Everything under /admin is guarded here, and that includes any page added
// under /admin later, because a layout wraps its own children.
//
// That is exactly how the owner was locked out of her own platform. A sign-in
// page had been put at /admin/login, inside this layout, so a signed-out
// administrator hit the guard below before the form ever rendered and was
// sent to /login. The member sign-in page refuses admin accounts and tells
// her administrators sign in at /admin, which arrives back here. A closed
// loop with no way out of it.
//
// The proxy has an AUTH_PAGES exemption that was meant to prevent this, and
// it could never have: the proxy and this layout are two separate guards, and
// exempting a path from one says nothing about the other.
//
// So the door is at /admin-sign-in, outside this layout, and this redirect
// points at it. Anyone signed out, on any admin URL, lands on a form they can
// actually use.
export default async function AdminLayout({
      children,
}: {
      children: React.ReactNode
}) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
          redirect('/admin-sign-in')
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
