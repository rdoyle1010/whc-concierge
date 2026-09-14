import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderAnyDocumentPdf, PLAN_KINDS } from '@/lib/documents/render-pdf'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'
import { missingFromPlan, type PlanDocument } from '@/lib/documents/plan-types'

// The document as a file somebody can complete.
//
// Printing the web page produces a locked PDF full of square brackets, which
// is homework with no pencil: a buyer has the free Adobe Reader, not Acrobat,
// and cannot type into it. This generates the PDF instead, with a real form
// field for every bracket, so the property fills it in, saves it and prints
// it without buying anything or asking us to edit it for them.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await context.params
  const admin = createAdminClient()

  const { data: row, error } = await admin.from('operational_documents')
    .select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'That document was not found.' }, { status: 404 })

  const document = (row.document || {}) as SopDocument
  // An empty document would render as a title page and six pages of nothing,
  // which looks like a broken generator rather than a document nobody has
  // written yet. Those are different problems and only one is fixable here.
  if (!Object.keys(document).length) {
    return NextResponse.json({ error: 'Nothing has been written into that one yet.' }, { status: 400 })
  }

  const missing = PLAN_KINDS.has(row.kind)
    ? missingFromPlan(document as unknown as PlanDocument)
    : row.kind === 'sop' ? missingFromSop(document) : []
  if (missing.length) {
    return NextResponse.json({
      error: `That one is not finished: it still needs ${missing.join(', ')}.`,
    }, { status: 400 })
  }

  try {
    const pdf = await renderAnyDocumentPdf(row.kind, document)
    // The reference, not the title. It is what a property files under and
    // what every other document points at, and two files called
    // "Stock Transfer.pdf" in one folder is a filing system that has stopped
    // working.
    const fileName = `${row.reference}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (caught: any) {
    console.error('[Standards] PDF generation failed:', caught?.message)
    return NextResponse.json({ error: 'That document could not be made into a PDF.' }, { status: 500 })
  }
}
