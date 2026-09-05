import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { renderPublicAgency } from '@/app/agency/about/page'

// The administrator's view of unpublished copy for /agency/about.
//
// Same reason as /preview/home: reading a search parameter makes a page
// dynamic in this version of Next, so the ?pagePreview=draft flag that used
// to live on the public page quietly cancelled its own revalidate and made
// every visitor pay for a server render. The preview has its own address now.
export const dynamic = 'force-dynamic'

export default async function DraftPreview() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login?redirect=/preview/agency')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  // Not a 403. An unpublished draft is not something to confirm the existence
  // of to somebody who should not be looking at it.
  if (profile?.role !== 'admin') redirect('/agency/about')

  return renderPublicAgency(true)
}
