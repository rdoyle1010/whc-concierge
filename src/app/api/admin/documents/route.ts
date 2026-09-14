import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'
import { isValidReference } from '@/lib/documents/reference'
import { EXAMPLE_SOP } from '@/lib/documents/examples'

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
