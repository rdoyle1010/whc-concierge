import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ATTACHMENT_BUCKET, loadAttachments, attachmentsForSlugs } from '@/lib/documents/attachments'
import { slugsInOrders } from '@/lib/documents/entitlement'

// One file, to somebody who bought a pack containing it.
//
// The same two ways of being the buyer as the document download, and the same
// rule: the entitlement is checked against their own orders, never against a
// parameter in the URL.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('t') || '').trim()
  const id = String(req.nextUrl.searchParams.get('id') || '').trim()
  if (!id) return NextResponse.json({ error: 'That link is incomplete.' }, { status: 400 })

  const admin = createAdminClient()

  let orders: { pack_slug: string | null }[] | null = null
  if (token) {
    const { data: order } = await admin.from('standards_orders')
      .select('buyer_email').eq('access_token', token).maybeSingle()
    if (!order) return NextResponse.json({ error: 'That link does not open a library.' }, { status: 404 })
    const { data: theirs } = await admin.from('standards_orders')
      .select('pack_slug').ilike('buyer_email', order.buyer_email)
    orders = theirs || []
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to download this.' }, { status: 401 })
    const { data: theirs } = await admin.from('standards_orders')
      .select('pack_slug')
      .or(`buyer_user_id.eq.${user.id},buyer_email.ilike.${(user.email || '').replace(/[,()]/g, '')}`)
    orders = theirs || []
  }

  // Live only, and only from a pack they bought. A file taken off sale stops
  // being downloadable, which is the point of taking it off sale.
  const theirFiles = attachmentsForSlugs(await loadAttachments(true, admin), slugsInOrders(orders))
  const file = theirFiles.find(entry => entry.id === id)
  if (!file) {
    return NextResponse.json({ error: 'That file is not part of what you bought.' }, { status: 403 })
  }

  // A signed URL rather than streaming it through here. A sixty megabyte
  // workbook does not need to pass through a function with a twenty-six
  // second ceiling on it.
  const { data, error } = await admin.storage.from(ATTACHMENT_BUCKET)
    .createSignedUrl(file.storagePath, 300, { download: file.fileName })
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'That file could not be fetched just now.' }, { status: 502 })
  }

  return NextResponse.redirect(data.signedUrl)
}
