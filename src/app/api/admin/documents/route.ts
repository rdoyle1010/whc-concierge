import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'
import { isValidReference } from '@/lib/documents/reference'
import { EXAMPLE_SOP } from '@/lib/documents/examples'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'

// The library, and the sign-off that stands between a draft and a client.
//
// One rule runs through all of this: a document is draft until she has read
// it and pressed approve, and nothing unapproved can be issued to anybody. A
// generated document reaching a property without a person reading it is the
// worst thing this platform could do, and it would be found out later by
// somebody else in front of an assessor.
//
// The approval is recorded against the version it applied to. Approving
// version one says nothing about version four, so any edit clears it and it
// goes round again. That is deliberately inconvenient.

export const dynamic = 'force-dynamic'

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()

  const { data, error } = await admin.from('operational_documents')
    .select('*').is('employer_id', null).order('created_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ rows: [], unavailable: true, reason: error.message })

  // What each one still needs, worked out here rather than on the screen, so
  // the list and the document cannot disagree about whether it is ready.
  const rows = (data || []).map((row: any) => ({
    ...row,
    missing: row.kind === 'sop' ? missingFromSop((row.document || {}) as SopDocument) : [],
    stale: row.status === 'approved' && row.approved_version !== row.version,
    written: Object.keys(row.document || {}).length > 0,
  }))

  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()

  // Seeding the worked example, so there is something to read and sign off
  // without anybody pasting a page of JSON into a SQL editor.
  if (action === 'add_example') {
    const { data: exists } = await admin.from('operational_documents')
      .select('id').eq('reference', EXAMPLE_SOP.reference).maybeSingle()
    if (exists?.id) return NextResponse.json({ error: 'That one is already in the library.' }, { status: 400 })

    const { error } = await admin.from('operational_documents').insert({
      reference: EXAMPLE_SOP.reference,
      kind: EXAMPLE_SOP.kind,
      title: EXAMPLE_SOP.title,
      department: EXAMPLE_SOP.department,
      version: EXAMPLE_SOP.version,
      document: EXAMPLE_SOP,
      status: 'draft',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // The register, before any of it is written.
  //
  // Four hundred and sixty documents across fourteen departments, each an
  // empty draft carrying its reference, its department and the tier it
  // belongs to. Knowing precisely which documents are owed is worth having on
  // its own: four hundred and sixty known gaps is a plan, and four hundred
  // and sixty unwritten documents nobody has listed is an intention.
  //
  // Safe to run twice. Anything already in the library is left exactly as it
  // is, including anything already signed off, because an import must never
  // be able to undo an approval.
  if (action === 'import_plan') {
    const { data: held } = await admin.from('operational_documents')
      .select('reference').is('employer_id', null).limit(2000)
    const already = new Set((held || []).map((row: any) => row.reference))

    const missing = LIBRARY_PLAN.filter(entry => !already.has(entry.reference))
    if (!missing.length) {
      return NextResponse.json({ success: true, added: 0, note: 'The whole plan is already in the library.' })
    }

    const rows = missing.map(entry => ({
      reference: entry.reference,
      kind: entry.reference.includes('-CHK-') ? 'checklist' : 'sop',
      title: entry.title,
      department: entry.department,
      version: '0.1',
      status: 'draft',
      tier: entry.tier,
      tier_reason: entry.why || null,
      // Empty on purpose. The shape is filled in when it is drafted, and
      // missingFromSop will refuse to let an empty one be signed off.
      document: {},
    }))

    // In batches, because four hundred and sixty rows in one statement is a
    // request the platform will not finish inside its own time limit.
    let added = 0
    for (let at = 0; at < rows.length; at += 100) {
      const slice = rows.slice(at, at + 100)
      const { error } = await admin.from('operational_documents').insert(slice)
      if (error) {
        return NextResponse.json({
          error: `Imported ${added} and then stopped: ${error.message}`,
        }, { status: 500 })
      }
      added += slice.length
    }

    return NextResponse.json({ success: true, added })
  }

  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Missing document' }, { status: 400 })

  const { data: row, error: readError } = await admin.from('operational_documents')
    .select('*').eq('id', id).maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'That document was not found.' }, { status: 404 })

  // Signed off, by name, against a version.
  if (action === 'approve') {
    if (!isValidReference(row.reference)) {
      return NextResponse.json({ error: 'That reference is not in the house format, so it cannot be approved.' }, { status: 400 })
    }

    // Refused while anything is missing. An approval is a statement that
    // somebody read a finished document, and a half-finished one being signed
    // off is exactly the failure this whole flow exists to prevent.
    const missing = row.kind === 'sop' ? missingFromSop((row.document || {}) as SopDocument) : []
    if (missing.length) {
      return NextResponse.json({
        error: `Not ready to sign off. It still needs: ${missing.join(', ')}.`,
      }, { status: 400 })
    }

    const { error } = await admin.from('operational_documents').update({
      status: 'approved',
      approved_by: actor.id,
      approved_by_name: actor.email || null,
      approved_at: new Date().toISOString(),
      approved_version: row.version,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Back to draft. Clears the approval rather than keeping it around greyed
  // out, because a stale approval on screen is worse than none.
  if (action === 'unapprove' || action === 'retire') {
    const { error } = await admin.from('operational_documents').update({
      status: action === 'retire' ? 'retired' : 'draft',
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      approved_version: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { error } = await admin.from('operational_documents').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
