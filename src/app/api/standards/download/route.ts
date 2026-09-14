import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderDocumentPdf } from '@/lib/documents/document-pdf'
import { ownedReferences } from '@/lib/documents/stock'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'

// One document, to somebody who has paid for it.
//
// Two things are checked and neither is optional: the token belongs to a real
// order, and that buyer's orders actually cover this reference. A download
// route that trusts a reference in a query string is a shop where the
// complete library costs thirty-nine pounds.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('t') || '').trim()
  const reference = String(req.nextUrl.searchParams.get('reference') || '').trim()
  if (!token || !reference) {
    return NextResponse.json({ error: 'That link is incomplete.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin.from('standards_orders')
    .select('buyer_email').eq('access_token', token).maybeSingle()
  if (orderError) {
    return NextResponse.json({ error: 'We cannot reach your library just now. Try again shortly.' }, { status: 503 })
  }
  if (!order) return NextResponse.json({ error: 'That link does not open a library.' }, { status: 404 })

  const { data: theirs } = await admin.from('standards_orders')
    .select('pack_slug, document_reference').ilike('buyer_email', order.buyer_email)

  if (!ownedReferences(theirs || []).has(reference)) {
    return NextResponse.json({ error: 'That document is not part of what you bought.' }, { status: 403 })
  }

  const { data: row, error } = await admin.from('operational_documents')
    .select('*').is('employer_id', null).eq('reference', reference).eq('status', 'approved').maybeSingle()
  if (error) return NextResponse.json({ error: 'We cannot reach that document just now.' }, { status: 503 })
  if (!row) {
    return NextResponse.json({
      error: 'That one is not signed off yet. It appears here the day it is, and you already own it.',
    }, { status: 404 })
  }

  const document = (row.document || {}) as SopDocument
  const missing = row.kind === 'sop' ? missingFromSop(document) : []
  if (!Object.keys(document).length || missing.length) {
    return NextResponse.json({ error: 'That one is not finished yet.' }, { status: 404 })
  }

  try {
    const pdf = await renderDocumentPdf(document)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${row.reference}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (caught: any) {
    console.error('[Standards download] PDF failed:', caught?.message)
    return NextResponse.json({ error: 'That document could not be made into a PDF just now.' }, { status: 500 })
  }
}
