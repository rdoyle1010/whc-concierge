import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderAnyDocumentPdf, PLAN_KINDS } from '@/lib/documents/render-pdf'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'
import { missingFromPlan, type PlanDocument } from '@/lib/documents/plan-types'
import { FREE_SAMPLES } from '@/lib/documents/samples'

// A complete document, free, to anybody who asks.
//
// The shop has six photographs of pages and no way to open one. A stranger is
// being asked for two and a half thousand pounds for files, by a brand they
// have not heard of, with no sample, no named author and no refund line. Every
// one of those is a reason to leave, and the sample is the cheapest to fix:
// the documents are the argument, and nothing written about them on a web page
// is as persuasive as one of them open on the screen.
//
// No email wall. A form in front of a sample halves the number of people who
// see the thing that sells the product, in exchange for addresses belonging to
// the ones who were not going to buy. What is given away is listed in
// samples.ts, it is deliberately not the documents that carry the liability,
// and it goes through the same renderer as a paid one, so what a stranger
// opens is exactly what a buyer gets.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest) {
  const reference = String(req.nextUrl.searchParams.get('reference') || '').trim()
  if (!FREE_SAMPLES.includes(reference)) {
    return NextResponse.json({ error: 'That one is not a free sample.' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: row, error } = await admin.from('operational_documents')
    .select('*').is('employer_id', null).eq('reference', reference).eq('status', 'approved').maybeSingle()
  if (error) return NextResponse.json({ error: 'We cannot reach that document just now.' }, { status: 503 })
  if (!row) return NextResponse.json({ error: 'That sample is not ready yet.' }, { status: 404 })

  const document = (row.document || {}) as SopDocument
  const missing = PLAN_KINDS.has(row.kind)
    ? missingFromPlan(document as unknown as PlanDocument)
    : row.kind === 'sop' ? missingFromSop(document) : []
  if (!Object.keys(document).length || missing.length) {
    return NextResponse.json({ error: 'That sample is not finished yet.' }, { status: 404 })
  }

  try {
    const pdf = await renderAnyDocumentPdf(row.kind, document)
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        // Inline. A download prompt on a sample is one more decision between
        // somebody and the thing that convinces them.
        'Content-Disposition': `inline; filename="${row.reference}.pdf"`,
        // Cacheable, because it is the same file for everybody and it is the
        // page most likely to be forwarded to a general manager.
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (caught: any) {
    console.error('[Standards sample] PDF failed:', caught?.message)
    return NextResponse.json({ error: 'That sample could not be made into a PDF just now.' }, { status: 500 })
  }
}
