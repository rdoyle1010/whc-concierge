import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { renderHome } from '@/app/page'

// The administrator's view of unpublished website copy.
//
// This used to live on the homepage itself, behind ?websitePreview=draft.
// Reading a search parameter makes a page dynamic in this version of Next,
// so one person's occasional preview cost every visitor a cold server render
// of the busiest page on the site. It has its own address now, and the cost
// falls where it belongs.
export const dynamic = 'force-dynamic'

export default async function HomeDraftPreview() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login?redirect=/preview/home')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  // Not a 403. An unpublished draft is not something to confirm the existence
  // of to somebody who should not be looking at it.
  if (profile?.role !== 'admin') redirect('/')

  return renderHome(true)
}
