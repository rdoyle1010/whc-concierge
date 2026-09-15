import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { slugsInOrders } from '@/lib/documents/entitlement'
import { toolBySlug } from '@/lib/documents/tools/registry'

// A tool, to the person who bought it.
//
// Built on request rather than stored, like the reporting workbook, so a file
// downloaded today matches the version of the tool that exists today. The
// same two ways of being the buyer as every other download here, and the same
// rule: entitlement is checked against their own orders, never against
// anything in the URL. The slug in the URL says which tool; it never says
// whether they may have it.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const slug = String(req.nextUrl.searchParams.get('slug') || '').trim()
  const tool = toolBySlug(slug)
  if (!tool) return NextResponse.json({ error: 'That is not one of our tools.' }, { status: 404 })

  const token = String(req.nextUrl.searchParams.get('t') || '').trim()
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

  if (!slugsInOrders(orders || []).includes(tool.slug)) {
    return NextResponse.json({ error: `${tool.name} is not in your library.` }, { status: 403 })
  }

  const file = tool.build()
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${tool.fileName}"`,
      'Content-Length': String(file.length),
      'Cache-Control': 'no-store',
    },
  })
}
