import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { missingFromSop, type SopDocument } from '@/lib/documents/types'
import { isValidReference } from '@/lib/documents/reference'
import { EXAMPLE_SOP } from '@/lib/documents/examples'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'
import { draftDocument, draftingConfigured } from '@/lib/documents/draft'
import { submitDraftBatch, collectDraftBatch, batchingConfigured } from '@/lib/documents/batch'
import { documentFromDraft } from '@/lib/documents/assemble'
import { isLifeSafety, LIFE_SAFETY_CONFIRMATION } from '@/lib/documents/safety'

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

// The model is given eighteen seconds inside the twenty-six the host allows.
export const maxDuration = 26

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()

  // All of them, and without their bodies.
  //
  // This was capped at three hundred, which did not truncate a list so much
  // as quietly lie: the counts across the top are computed from what comes
  // back, so a library of four hundred and sixty reported itself as three
  // hundred planned and the tier totals underneath it were all wrong. A cap
  // on a list is a display decision. A cap on the thing the summary is
  // calculated from is a wrong number on screen with nothing to suggest it.
  //
  // The document bodies stay behind. Four hundred and sixty full procedures
  // is a payload nobody needs to render a list, and one is fetched when
  // somebody opens it.
  const { data, error } = await admin.from('operational_documents')
    .select('*').is('employer_id', null).order('created_at', { ascending: false }).limit(2000)
  if (error) return NextResponse.json({ rows: [], unavailable: true, reason: error.message })

  // What each one still needs, worked out here rather than on the screen, so
  // the list and the document cannot disagree about whether it is ready.
  const rows = (data || []).map((row: any) => {
    const { document, ...rest } = row
    return {
      ...rest,
      missing: row.kind === 'sop' ? missingFromSop((document || {}) as SopDocument) : [],
      stale: row.status === 'approved' && row.approved_version !== row.version,
      written: Object.keys(document || {}).length > 0,
      lifeSafety: isLifeSafety(row),
    }
  })

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

    // Its tier comes from the plan, because it is in the plan. Added without
    // one it is invisible under every tier filter, which is how a library
    // reporting one written document could show none of them.
    const planned = LIBRARY_PLAN.find(entry => entry.reference === EXAMPLE_SOP.reference)

    const { error } = await admin.from('operational_documents').insert({
      reference: EXAMPLE_SOP.reference,
      kind: EXAMPLE_SOP.kind,
      title: EXAMPLE_SOP.title,
      department: EXAMPLE_SOP.department,
      version: EXAMPLE_SOP.version,
      document: EXAMPLE_SOP,
      status: 'draft',
      tier: planned?.tier || null,
      tier_reason: planned?.why || null,
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
      .select('id, reference, tier').is('employer_id', null).limit(2000)
    const already = new Set((held || []).map((row: any) => row.reference))

    // A row already in the library but missing its tier gets it filled in.
    //
    // Skipping anything already held is right for content and wrong for a
    // blank: the worked example was added before the import, so the import
    // passed over it and left it with no tier at all, which made it invisible
    // under every tier filter while the counter above said one document was
    // written. Filling a blank is not overwriting, and nothing else here is
    // touched.
    let repaired = 0
    const untiered = (held || []).filter((row: any) => !row.tier)
    for (const row of untiered) {
      const planned = LIBRARY_PLAN.find(entry => entry.reference === row.reference)
      if (!planned) continue
      const { error: tierError } = await admin.from('operational_documents')
        .update({ tier: planned.tier, tier_reason: planned.why || null, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (tierError) {
        return NextResponse.json({ error: `Could not set the tier on ${row.reference}: ${tierError.message}` }, { status: 500 })
      }
      repaired += 1
    }

    const missing = LIBRARY_PLAN.filter(entry => !already.has(entry.reference))
    if (!missing.length) {
      return NextResponse.json({
        success: true, added: 0, repaired,
        note: repaired
          ? `The whole plan was already there. ${repaired} had no tier and now do.`
          : 'The whole plan is already in the library.',
      })
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

    return NextResponse.json({ success: true, added, repaired })
  }

  // Draft a whole tier at once, and collect it later.
  //
  // Pressing a button four hundred and sixty times is not a workflow. This
  // submits every unwritten document in a tier to the batch API, which has no
  // request timeout over it and costs half, and puts the receipt in
  // document_batches so the results can be collected by a later request.
  if (action === 'draft_tier') {
    if (!batchingConfigured()) {
      return NextResponse.json({ error: 'Talent House AI is not switched on yet.' }, { status: 503 })
    }
    const tier = String(body.tier || '')
    if (!['day-1', 'month-1', 'quarter-1'].includes(tier)) {
      return NextResponse.json({ error: 'Choose a tier to draft.' }, { status: 400 })
    }

    const { data: waiting, error: readError } = await admin.from('operational_documents')
      .select('id, title, reference, department, document, status')
      .is('employer_id', null).eq('tier', tier).eq('status', 'draft').limit(2000)
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    // Only the empty ones. Redrafting over something already written throws
    // away whatever a person corrected in it.
    const items = (waiting || [])
      .filter((row: any) => Object.keys(row.document || {}).length === 0)
      .map((row: any) => ({
        id: row.id, title: row.title, reference: row.reference, department: row.department || '',
      }))

    if (!items.length) {
      return NextResponse.json({ success: true, submitted: 0, note: 'Every document in that tier is written already.' })
    }

    const sent = await submitDraftBatch(items)
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 })

    const { error: receiptError } = await admin.from('document_batches').insert({
      provider_batch_id: sent.batchId,
      tier,
      requested: sent.count,
      submitted_by: actor.id,
      status: 'submitted',
    })
    // The batch is running whether or not we managed to write that down, and
    // saying it failed would have her submit the same four hundred documents
    // again.
    if (receiptError) {
      return NextResponse.json({
        success: true, submitted: sent.count,
        warning: `Submitted, but the receipt did not save: ${receiptError.message}. The batch id is ${sent.batchId}.`,
      })
    }

    return NextResponse.json({ success: true, submitted: sent.count })
  }

  // Collect whatever has finished.
  if (action === 'collect') {
    const { data: runs } = await admin.from('document_batches')
      .select('*').in('status', ['submitted', 'collecting']).order('created_at', { ascending: true }).limit(10)

    if (!runs?.length) return NextResponse.json({ success: true, collected: 0, note: 'Nothing is waiting to come back.' })

    let collected = 0
    let stillRunning = 0
    // Bookkeeping that did not save. The documents are safely written either
    // way, but a receipt that never updated leaves a finished batch marked as
    // still running, which means collecting it again forever.
    const bookkeeping: string[] = []

    for (const run of runs) {
      const progress = await collectDraftBatch(run.provider_batch_id)
      if (!progress.ok) {
        const { error: noteError } = await admin.from('document_batches')
          .update({ note: progress.error, updated_at: new Date().toISOString() }).eq('id', run.id)
        if (noteError) bookkeeping.push(`could not record why ${run.provider_batch_id} failed: ${noteError.message}`)
        continue
      }
      if (!progress.ready) { stillRunning += 1; continue }

      let failed = 0
      for (const result of progress.results) {
        if (!result.draft) { failed += 1; continue }

        const { data: target } = await admin.from('operational_documents')
          .select('*').eq('id', result.id).maybeSingle()
        // Gone, or written by a person while the batch was running. Either
        // way it is not ours to overwrite.
        if (!target || target.status === 'approved') continue
        if (Object.keys(target.document || {}).length > 0) continue

        const { error } = await admin.from('operational_documents').update({
          document: documentFromDraft(target, result.draft),
          status: 'draft',
          updated_at: new Date().toISOString(),
        }).eq('id', result.id)
        if (error) failed += 1
        else collected += 1
      }

      const { error: receiptError } = await admin.from('document_batches').update({
        status: 'done',
        collected: progress.results.length - failed,
        failed,
        updated_at: new Date().toISOString(),
      }).eq('id', run.id)
      if (receiptError) {
        bookkeeping.push(`${run.provider_batch_id} was collected but is still marked as running: ${receiptError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      collected,
      stillRunning,
      warning: bookkeeping.length ? `The documents are saved, but: ${bookkeeping.join('; ')}.` : undefined,
    })
  }

  // Everything below this line is about one document, so it needs an id.
  //
  // The two actions above are not: writing a tier and collecting a batch are
  // both about the library. They were underneath this guard, so every press
  // of either answered "Missing document", which is true of a question
  // nobody asked.
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

    // Life safety before elegance, which is her own rule and the right one.
    //
    // The evacuation route, the muster point, the plant room and the person
    // holding the pool operator qualification are facts about one building.
    // Nothing that drafted this knows them, so signing one of these off is a
    // separate statement rather than the same button.
    if (isLifeSafety(row) && body.competentPersonChecked !== true) {
      return NextResponse.json({
        error: 'This is a life safety document. Confirm that a competent person has checked it against the actual premises before signing it off.',
        needsCompetentPerson: true,
        confirmation: LIFE_SAFETY_CONFIRMATION,
      }, { status: 409 })
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

  // Draft it. Lands as draft, always, whatever it contains.
  if (action === 'draft') {
    if (!draftingConfigured()) {
      return NextResponse.json({ error: 'Talent House AI is not switched on yet.' }, { status: 503 })
    }
    if (row.status === 'approved') {
      return NextResponse.json({
        error: 'That one is signed off. Take the sign-off back first if you want to redraft it.',
      }, { status: 400 })
    }

    const result = await draftDocument({
      title: row.title,
      reference: row.reference,
      department: row.department || '',
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

    const document = documentFromDraft(row, result.draft)

    const { error } = await admin.from('operational_documents').update({
      document,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, lifeSafety: isLifeSafety(row) })
  }

  // One document, fetched when it is opened rather than carried by the list.
  if (action === 'read') {
    return NextResponse.json({ success: true, document: row.document || {} })
  }

  if (action === 'delete') {
    const { error } = await admin.from('operational_documents').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
