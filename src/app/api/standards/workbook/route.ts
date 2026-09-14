import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ownedReferences } from '@/lib/documents/stock'
import { bundleReferenceMap } from '@/lib/documents/pricing-server'
import { reportingWorkbook, WORKBOOK_FILE_NAME } from '@/lib/documents/finance/workbook'
import { FINANCE_REGISTER } from '@/lib/documents/finance/register'

// The workbook behind the reporting pack.
//
// Built on request rather than stored, which is not a shortcut. The tabs, the
// lines and the definitions all come from the same register the PDFs are
// rendered from, so a workbook downloaded today matches the documents beside
// it by construction. A file uploaded once and left in a bucket agrees with
// the pack until the first time somebody edits a definition.
//
// The same two ways of being the buyer as every other download, and the same
// rule: entitlement is checked against their own orders, never against
// anything in the URL.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

const DASHBOARD = FINANCE_REGISTER[0].reference

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('t') || '').trim()
  const admin = createAdminClient()

  let orders: { pack_slug: string | null; document_reference: string | null }[] | null = null

  if (token) {
    const { data: order } = await admin.from('standards_orders')
      .select('buyer_email').eq('access_token', token).maybeSingle()
    if (!order) return NextResponse.json({ error: 'That link does not open a library.' }, { status: 404 })
    const { data: theirs } = await admin.from('standards_orders')
      .select('pack_slug, document_reference').ilike('buyer_email', order.buyer_email)
    orders = theirs || []
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to download this.' }, { status: 401 })
    const { data: theirs } = await admin.from('standards_orders')
      .select('pack_slug, document_reference')
      .or(`buyer_user_id.eq.${user.id},buyer_email.ilike.${(user.email || '').replace(/[,()]/g, '')}`)
    orders = theirs || []
  }

  // Owning any report in the pack is owning the workbook. It is one file
  // covering all of them and there is no sensible way to own a fifth of a
  // spreadsheet whose sheets point at each other.
  const owned = ownedReferences(orders, await bundleReferenceMap(admin))
  if (!owned.has(DASHBOARD)) {
    return NextResponse.json({
      error: 'The reporting workbook comes with the financial reporting pack.',
    }, { status: 403 })
  }

  const workbook = reportingWorkbook()

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${WORKBOOK_FILE_NAME}"`,
      'Content-Length': String(workbook.length),
      'Cache-Control': 'no-store',
    },
  })
}
