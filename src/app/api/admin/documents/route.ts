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
import { QUARTER_ONE_DRAFTS } from '@/lib/documents/quarter-one'
import { POOL_PLANS } from '@/lib/documents/pool-plans'
import { GUIDE_PLANS } from '@/lib/documents/guide/plans'
import { missingFromPlan, type PlanDocument } from '@/lib/documents/plan-types'
import { PLAN_KINDS } from '@/lib/documents/render-pdf'
import { RISK_ASSESSMENT_PLANS } from '@/lib/documents/risk-assessment-plans'
import { planCollection } from '@/lib/documents/collect-plan'
import { CHECKLIST_PLANS } from '@/lib/documents/checklist-plans'
import { FINANCE_PLANS } from '@/lib/documents/finance-plans'
import { isLifeSafety, LIFE_SAFETY_CONFIRMATION } from '@/lib/documents/safety'
import { placeholdersIn } from '@/lib/documents/placeholders'

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

// What a document of this kind still needs. A plan and a procedure are
// complete in different ways, and checking a Normal Operating Procedure for
// steps with auditable standards would pass every one of them by asking a
// question that does not apply.
function missingFor(kind: string, document: any): string[] {
  // An empty document is missing everything, and saying so is the whole job.
  //
  // This used to return an empty array for an unwritten document, so the list
  // would not shout "missing everything" at four hundred and sixty rows that
  // had not been drafted yet. The approve action calls the same function, so
  // "nothing missing" read as "ready to sign off", and documents with nothing
  // in them but a reference were signed off by name and by date.
  //
  // That is the exact failure this library exists to prevent: an approval is
  // a statement that somebody read a finished document, and there was nothing
  // to read. The list now decides for itself not to ask about an unwritten
  // row, using the flag it already has.
  if (!document || !Object.keys(document).length) return ['everything: nothing has been written into it yet']
  if (PLAN_KINDS.has(kind)) {
    return missingFromPlan(document as PlanDocument)
  }
  return kind === 'sop' ? missingFromSop(document as SopDocument) : []
}

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
      missing: Object.keys(document || {}).length ? missingFor(row.kind, document) : [],
      stale: row.status === 'approved' && row.approved_version !== row.version,
      written: Object.keys(document || {}).length > 0,
      lifeSafety: isLifeSafety(row),
      // How much the property has to fill in before this is usable in their
      // building. Worth knowing both ways round: nothing to complete on a
      // procedure that should name a muster point means the drafter invented
      // one, and thirty things to complete is a document a buyer abandons.
      blanks: placeholdersIn((document || {}) as SopDocument).length,
    }
  })

  // What is being written right now, so nobody has to ask whether anything is
  // happening. A screen that cannot answer that is a screen somebody presses
  // a button on again.
  const { data: runs } = await admin.from('document_batches')
    .select('provider_batch_id, tier, requested, collected, failed, status, note, created_at')
    .order('created_at', { ascending: false }).limit(5)

  return NextResponse.json({ rows, runs: runs || [] })
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

    // Not twice.
    //
    // A batch in flight has not written anything yet, so every document it is
    // working on is still empty and still looks eligible. Pressing the button
    // again while she waits therefore submits exactly the same documents a
    // second time and pays for them twice, which is precisely what happened
    // the first afternoon this existed.
    const { data: inFlight } = await admin.from('document_batches')
      .select('provider_batch_id, requested, created_at')
      .eq('tier', tier).in('status', ['submitted', 'collecting']).limit(1)

    if (inFlight?.length) {
      const since = new Date(inFlight[0].created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
      return NextResponse.json({
        error: `That tier is already being written. ${inFlight[0].requested} documents went off at ${since} and `
          + 'sending them again would write the same documents twice and pay for them twice. Press Collect what is '
          + 'ready instead.',
        alreadyRunning: true,
      }, { status: 409 })
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

    // The receipt is written before the money is spent.
    //
    // It used to be written after, and treated as a warning when it failed,
    // on the reasoning that a batch already running should not be reported as
    // a failure. That reasoning was wrong twice over. The warning carried the
    // only record of the batch id and the screen showed the success message
    // instead of it, so the id was lost the instant it was created. And a
    // batch nobody has the id of cannot be collected, which means it was paid
    // for and produced nothing: three hundred and thirty-eight documents,
    // twice, with no way to reach either run.
    //
    // So a row is reserved first. If it cannot be written there is no way to
    // track a batch, and a batch that cannot be tracked must not be started.
    const reservation = `pending-${crypto.randomUUID()}`
    const { data: receipt, error: receiptError } = await admin.from('document_batches').insert({
      provider_batch_id: reservation,
      tier,
      requested: items.length,
      submitted_by: actor.id,
      status: 'submitted',
    }).select('id').maybeSingle()

    if (receiptError || !receipt?.id) {
      return NextResponse.json({
        error: 'Nothing was sent, and nothing has been charged. The batch register could not be written to, so '
          + `there would be no way to collect the results: ${receiptError?.message || 'no row came back'}. `
          + 'Run the documents batch migration in Supabase and try again.',
      }, { status: 500 })
    }

    const sent = await submitDraftBatch(items)
    if (!sent.ok) {
      // Nothing was started, so the reservation is removed rather than left
      // sitting there blocking the next attempt at this tier. Checked,
      // because a reservation that will not clear locks the tier out of every
      // future submission and nothing on screen would say why.
      const { error: clearError } = await admin.from('document_batches').delete().eq('id', receipt.id)
      if (clearError) {
        return NextResponse.json({
          error: `${sent.error} Nothing was charged. A placeholder row was also left behind and could not be `
            + `removed (${clearError.message}), which will block this tier until it is deleted.`,
        }, { status: 502 })
      }
      return NextResponse.json({ error: sent.error }, { status: 502 })
    }

    const { error: idError } = await admin.from('document_batches')
      .update({ provider_batch_id: sent.batchId, requested: sent.count, updated_at: new Date().toISOString() })
      .eq('id', receipt.id)

    // This one is genuinely a warning: the batch is running and paid for, and
    // the id is on screen so it can be adopted by hand.
    if (idError) {
      return NextResponse.json({
        success: true, submitted: sent.count,
        warning: `Sent, and running. But the batch id did not save: ${idError.message}. Write this down and use `
          + `Collect a batch by id: ${sent.batchId}`,
      })
    }

    return NextResponse.json({ success: true, submitted: sent.count })
  }

  // Drafting again the ones whose first draft came back unfinished.
  //
  // A draft that returned without steps was stored as written, so the
  // register reported nothing left to write while a dozen documents could not
  // be signed off, and each one was met individually by pressing sign off and
  // being refused. Finding them by hand is not a job anybody should do twice.
  //
  // Only procedures. Everything else in this library is written in the
  // repository rather than drafted, so it is complete by construction, and
  // sending a checklist to be rewritten would replace a finished document
  // with a guess.
  if (action === 'draft_incomplete') {
    if (!batchingConfigured()) {
      return NextResponse.json({ error: 'Talent House AI is not switched on yet.' }, { status: 503 })
    }

    // Not twice. A batch in flight has written nothing yet, so every document
    // it is working on still looks unfinished and still looks eligible, and
    // pressing again would send the same documents and pay for them twice.
    const { data: inFlight } = await admin.from('document_batches')
      .select('provider_batch_id, requested, created_at')
      .is('tier', null).like('note', 'Redraft%').in('status', ['submitted', 'collecting']).limit(1)

    if (inFlight?.length) {
      const since = new Date(inFlight[0].created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
      return NextResponse.json({
        error: `Those are already being written again. ${inFlight[0].requested} went off at ${since}, and `
          + 'sending them now would write the same documents twice and pay for them twice. Press Collect what '
          + 'is ready instead.',
        alreadyRunning: true,
      }, { status: 409 })
    }

    const { data: rows, error: readError } = await admin.from('operational_documents')
      .select('id, title, reference, department, kind, document, status')
      .is('employer_id', null).eq('kind', 'sop').neq('status', 'approved').limit(2000)
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    // Written, and still missing something. An empty one belongs to the tier
    // drafting above; this is only about the ones that look done and are not.
    const items = (rows || [])
      .filter((row: any) => Object.keys(row.document || {}).length > 0)
      .filter((row: any) => missingFor(row.kind, row.document).length > 0)
      .map((row: any) => ({
        id: row.id, title: row.title, reference: row.reference, department: row.department || '',
      }))

    if (!items.length) {
      return NextResponse.json({
        success: true, submitted: 0,
        note: 'Nothing to do: every written procedure has everything it needs.',
      })
    }

    // The receipt before the money, for the same reason as every other batch:
    // a run nobody has the id of has been paid for and cannot be collected.
    const reservation = `pending-${crypto.randomUUID()}`
    const { data: receipt, error: receiptError } = await admin.from('document_batches').insert({
      provider_batch_id: reservation,
      tier: null,
      requested: items.length,
      submitted_by: actor.id,
      status: 'submitted',
      note: 'Redraft of documents whose first draft came back unfinished.',
    }).select('id').maybeSingle()

    if (receiptError || !receipt?.id) {
      return NextResponse.json({
        error: 'Nothing was sent and nothing has been charged. The batch register could not be written to, so '
          + `there would be no way to collect the results: ${receiptError?.message || 'no row came back'}.`,
      }, { status: 500 })
    }

    const sent = await submitDraftBatch(items)
    if (!sent.ok) {
      const { error: clearError } = await admin.from('document_batches').delete().eq('id', receipt.id)
      if (clearError) {
        return NextResponse.json({
          error: `${sent.error} Nothing was charged. A placeholder row was also left behind and could not be `
            + `removed (${clearError.message}), which will block the next attempt until it is deleted.`,
        }, { status: 502 })
      }
      return NextResponse.json({ error: sent.error }, { status: 502 })
    }

    const { error: idError } = await admin.from('document_batches')
      .update({ provider_batch_id: sent.batchId, requested: sent.count, updated_at: new Date().toISOString() })
      .eq('id', receipt.id)

    if (idError) {
      return NextResponse.json({
        success: true, submitted: sent.count,
        warning: `Sent, and running. But the batch id did not save: ${idError.message}. Write this down and use `
          + `Collect a batch by id: ${sent.batchId}`,
      })
    }

    return NextResponse.json({
      success: true,
      submitted: sent.count,
      note: `${sent.count} sent to be written again. A redraft only replaces what is there if it comes back `
        + 'more complete, so nothing can get worse. Come back later and press Collect what is ready.',
    })
  }

  // Collect whatever has finished.
  //
  // Bounded by the clock, not by a count. The host kills a function at
  // twenty-six seconds, and the first version of this did two round trips per
  // document: read it, then update it. Three hundred and thirty-eight
  // documents is six hundred and seventy-six sequential calls, which never
  // fits, so the run was killed halfway through with no receipt written and
  // the batch stayed unreachable.
  //
  // Now the whole run is read in one go, planned without touching anything,
  // and saved fifty at a time, and the loop stops itself before the ceiling
  // rather than being stopped at it. Whatever was saved is saved, the receipt
  // records how far it got, and pressing the button again carries on: a
  // document that already has content is never rewritten, which is the thing
  // that makes stopping early safe.
  if (action === 'collect') {
    const startedAt = Date.now()
    // Six seconds of headroom under the host's ceiling: enough to finish the
    // chunk in hand and write the receipt that says where it stopped.
    const DEADLINE_MS = 20_000
    const outOfTime = () => Date.now() - startedAt > DEADLINE_MS

    const { data: runs, error: registerError } = await admin.from('document_batches')
      .select('*').in('status', ['submitted', 'collecting']).order('created_at', { ascending: true }).limit(10)

    // A register that cannot be read and a register with nothing in it are
    // completely different facts, and reporting both as "nothing is waiting"
    // is how two paid batches went missing without a word.
    if (registerError) {
      return NextResponse.json({
        error: `The batch register could not be read, so there is no way to know what is running: ${registerError.message}. `
          + 'Run the documents batch migration in Supabase.',
      }, { status: 500 })
    }

    if (!runs?.length) return NextResponse.json({ success: true, collected: 0, note: 'Nothing is waiting to come back.' })

    let collected = 0
    let stillRunning = 0
    // Runs that were not finished inside this request. Not a failure, but she
    // has to know to press it again, and a silent partial collection looks
    // exactly like a finished one.
    let unfinished = 0
    // Bookkeeping that did not save. The documents are safely written either
    // way, but a receipt that never updated leaves a finished batch marked as
    // still running, which means collecting it again forever.
    const bookkeeping: string[] = []
    // How far each unfinished run has got, and why a finished one produced
    // nothing. Silence is the one answer that cannot be acted on.
    const waiting: string[] = []
    const refused: string[] = []
    // Runs where every document had already been written by an earlier press
    // or an earlier batch. Worth saying: five batches of the same tier were
    // paid for, and four of them can only ever report nothing new.
    let alreadyHad = 0

    for (const run of runs) {
      if (outOfTime()) { unfinished += 1; continue }

      const progress = await collectDraftBatch(run.provider_batch_id)
      if (!progress.ok) {
        const { error: noteError } = await admin.from('document_batches')
          .update({ note: progress.error, updated_at: new Date().toISOString() }).eq('id', run.id)
        if (noteError) bookkeeping.push(`could not record why ${run.provider_batch_id} failed: ${noteError.message}`)
        continue
      }
      if (!progress.ready) {
        stillRunning += 1
        waiting.push(`${progress.counts.succeeded} of ${run.requested || progress.counts.processing + progress.counts.succeeded} written so far`)
        const { error: tickError } = await admin.from('document_batches').update({
          status: 'collecting',
          collected: progress.counts.succeeded,
          failed: progress.counts.errored,
          note: null,
          updated_at: new Date().toISOString(),
        }).eq('id', run.id)
        if (tickError) bookkeeping.push(`could not record progress on ${run.provider_batch_id}: ${tickError.message}`)
        continue
      }

      // Every document this run touches, read in a handful of calls rather
      // than one per result.
      const wanted = progress.results.filter(result => result.draft).map(result => result.id)
      const targets = new Map<string, Record<string, any>>()
      let unreadable = ''
      for (let i = 0; i < wanted.length; i += 200) {
        const { data: chunk, error: chunkError } = await admin.from('operational_documents')
          .select('*').in('id', wanted.slice(i, i + 200))
        if (chunkError) { unreadable = chunkError.message; break }
        for (const target of chunk || []) targets.set(target.id, target)
      }
      if (unreadable) {
        bookkeeping.push(`${run.provider_batch_id} finished, but the documents it belongs to could not be read: ${unreadable}`)
        continue
      }

      // A redraft is allowed to replace an unfinished document, and only a
      // redraft. The run says which it is: an ordinary collection has no
      // business deciding that a half-written document was the model's fault
      // rather than somebody's afternoon.
      const plan = planCollection(progress.results, targets, new Date().toISOString(), {
        replaceUnfinished: String(run.note || '').startsWith('Redraft'),
      })
      for (const reason of plan.refused) {
        if (refused.length < 3 && !refused.includes(reason)) refused.push(reason)
      }

      let failed = plan.failed
      let saved = 0
      let ranOut = false
      for (let i = 0; i < plan.writes.length; i += 50) {
        if (outOfTime()) { ranOut = true; break }
        const slice = plan.writes.slice(i, i + 50)
        const { error: writeError } = await admin.from('operational_documents').upsert(slice)
        if (writeError) {
          failed += slice.length
          bookkeeping.push(`${slice.length} documents from ${run.provider_batch_id} would not save: ${writeError.message}`)
        } else {
          saved += slice.length
        }
      }
      collected += saved
      if (!plan.writes.length && plan.skipped) alreadyHad += 1

      const receipt = ranOut
        ? {
            status: 'collecting',
            note: `${saved} saved so far. Press Collect what is ready again to finish this one.`,
          }
        : {
            status: 'done',
            note: failed
              ? `${failed} failed. ${plan.refused[0] || 'No reason was given.'}`
              : plan.writes.length ? null : `Nothing new: all ${plan.skipped} were already written.`,
          }
      if (ranOut) unfinished += 1

      const { error: receiptError } = await admin.from('document_batches').update({
        ...receipt,
        collected: saved,
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
      unfinished: unfinished || undefined,
      // Everything known about why nothing arrived, rather than the fact that
      // nothing arrived.
      progress: waiting.length ? waiting.join('; ') : undefined,
      refused: refused.length ? refused : undefined,
      note: !collected && alreadyHad
        ? `Nothing new. ${alreadyHad === 1 ? 'That batch was' : `Those ${alreadyHad} batches were`} a repeat of documents already written.`
        : undefined,
      warning: bookkeeping.length ? `The documents are saved, but: ${bookkeeping.join('; ')}.` : undefined,
    })
  }

  // The ones written by hand rather than drafted.
  //
  // The single Draft button gives the model twenty seconds inside a function
  // the host kills at twenty-six, which on a document of this length is a
  // coin toss and lost it nine times running. These nine are held as content
  // in the repository, so writing them is a database update and nothing else:
  // no model, no waiting, no failure mode beyond the write itself.
  if (action === 'write_authored') {
    const references = Object.keys(QUARTER_ONE_DRAFTS)

    const { data: targets, error: readError } = await admin.from('operational_documents')
      .select('*').is('employer_id', null).in('reference', references)
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    if (!targets?.length) {
      return NextResponse.json({
        error: 'None of those nine are in the library. Import the build plan first.',
      }, { status: 400 })
    }

    const now = new Date().toISOString()
    const writes: Record<string, any>[] = []
    let leftAlone = 0
    for (const target of targets) {
      // Signed off, or written since. Neither is ours to overwrite, and the
      // whole point of this library is that an approval means somebody read
      // that exact version.
      if (target.status === 'approved' || Object.keys(target.document || {}).length > 0) {
        leftAlone += 1
        continue
      }
      writes.push({
        ...target,
        document: documentFromDraft(target, QUARTER_ONE_DRAFTS[target.reference] as any),
        status: 'draft',
        updated_at: now,
      })
    }

    if (!writes.length) {
      return NextResponse.json({
        success: true, written: 0,
        note: `Nothing to do: all ${leftAlone} are already written.`,
      })
    }

    const { error: writeError } = await admin.from('operational_documents').upsert(writes)
    if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })

    // Said plainly, including what was skipped. A count that silently excludes
    // the ones left alone is the same class of lie as a truncated list.
    return NextResponse.json({
      success: true,
      written: writes.length,
      note: `${writes.length} written${leftAlone ? `, ${leftAlone} left alone because they already had content` : ''}. Read them before signing any off.`,
    })
  }

  // The two pool safety plans, written rather than drafted.
  //
  // Nothing could draft these. A Normal Operating Procedure is a statement of
  // facts about one building, and a model asked to produce one would produce
  // plausible dimensions, a plausible bather load and a plausible evacuation
  // route, all of which would be believed because they are typeset. So they
  // are written as structure with every fact left blank, and the property
  // supplies the facts.
  if (action === 'add_pool_plans' || action === 'add_risk_assessments'
    || action === 'add_checklists' || action === 'add_finance_pack' || action === 'add_everything') {
    // One press for all of it.
    //
    // Four buttons for four sets of documents was four chances to press three
    // of them, and the library then reports a gap that is not a gap. These are
    // all written in the repository rather than drafted, so bringing them in
    // is a database write and nothing else: there is no reason for it to be
    // four decisions.
    //
    // The individual actions stay, because a person who has just had one set
    // go wrong wants to retry that set rather than all of it.
    const plans = action === 'add_pool_plans' ? [...POOL_PLANS, ...GUIDE_PLANS]
      : action === 'add_risk_assessments' ? RISK_ASSESSMENT_PLANS
        : action === 'add_checklists' ? CHECKLIST_PLANS
          : action === 'add_finance_pack' ? FINANCE_PLANS
            : [...POOL_PLANS, ...GUIDE_PLANS, ...RISK_ASSESSMENT_PLANS, ...CHECKLIST_PLANS, ...FINANCE_PLANS]

    const now = new Date().toISOString()
    const references = plans.map(plan => plan.reference)

    // Read once rather than once per document. Forty-six documents at a select
    // and a write each is ninety-two round trips inside a function the host
    // kills at twenty-six seconds, and the failure mode is half a library
    // imported with no way to tell which half.
    const { data: existingRows, error: readError } = await admin.from('operational_documents')
      .select('id, reference, status, document').is('employer_id', null).in('reference', references)
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    const existingBy = new Map((existingRows || []).map((row: any) => [row.reference, row]))

    const writes: Record<string, any>[] = []
    let leftAlone = 0

    for (const plan of plans) {
      const existing = existingBy.get(plan.reference)
      // Signed off, or written since. Neither is ours to overwrite, and the
      // whole point of the sign-off is that it applies to the exact version
      // somebody read.
      if (existing && (existing.status === 'approved' || Object.keys(existing.document || {}).length > 0)) {
        leftAlone += 1
        continue
      }

      const built = plan.build()
      writes.push({
        ...(existing?.id ? { id: existing.id } : {}),
        reference: built.reference,
        kind: built.kind,
        title: built.title,
        department: built.department,
        version: built.version,
        tier: built.kind === 'report' ? 'month-1' : 'day-1',
        tier_reason: built.kind === 'risk-assessment'
          ? 'A written risk assessment is required before the area is used'
          : built.kind === 'checklist'
            ? 'The daily running sheet for that shift'
            : built.kind === 'report'
              ? 'Management reporting, once there is an operation to report on'
              : 'Required in writing before the spa opens',
        document: built,
        status: 'draft',
        updated_at: now,
      })
    }

    let added = 0
    for (let at = 0; at < writes.length; at += 20) {
      const chunk = writes.slice(at, at + 20)
      const { error } = await admin.from('operational_documents')
        .upsert(chunk, { onConflict: 'reference' })
      // Reported with what did land. A red box over a half-imported library
      // is worse than a red box with a number in it.
      if (error) {
        return NextResponse.json({
          error: `${error.message} ${added} were brought in before it stopped. Press it again.`,
        }, { status: 500 })
      }
      added += chunk.length
    }

    return NextResponse.json({
      success: true,
      written: added,
      note: added
        ? `${added} brought in${leftAlone ? `, ${leftAlone} left alone because they already had content` : ''}. `
          + 'Read each one against the actual premises before signing any of them off.'
        : `Nothing to do: all ${leftAlone} are already written.`,
    })
  }

  // Signing off everything that is finished, in one press.
  //
  // Four hundred and sixty documents at one click each is not a review, it is
  // a repetitive strain injury, and the screen that demands it gets abandoned
  // half way through. So this signs off every draft that is written, complete
  // and correctly referenced, and it holds back the ones where signing in
  // bulk would be a lie.
  //
  // Life safety documents are held back deliberately. Approving one states
  // that a competent person checked it against the actual premises, and no
  // single press covers forty fire and pool procedures. Those stay one at a
  // time, which is the point of them.
  if (action === 'approve_ready') {
    const { data: drafts, error: readError } = await admin.from('operational_documents')
      .select('id, reference, title, department, kind, version, document, status')
      .is('employer_id', null).eq('status', 'draft').limit(2000)
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

    const ready: { id: string; version: string | null }[] = []
    let lifeSafety = 0
    let unwritten = 0
    let incomplete = 0
    let badReference = 0

    for (const draft of drafts || []) {
      if (!isValidReference(draft.reference)) { badReference += 1; continue }
      if (!draft.document || !Object.keys(draft.document).length) { unwritten += 1; continue }
      if (missingFor(draft.kind, draft.document).length) { incomplete += 1; continue }
      if (isLifeSafety(draft)) { lifeSafety += 1; continue }
      ready.push({ id: draft.id, version: draft.version })
    }

    // In chunks, and grouped by version, against a function the host kills at
    // twenty-six seconds. One update per document would be four hundred round
    // trips and a timeout that leaves half the library signed off and no way
    // to tell which half. Grouped by version because an approval is recorded
    // against the version it applied to, and those differ between documents,
    // so one blanket update would record the wrong one.
    const now = new Date().toISOString()
    const byVersion = new Map<string, string[]>()
    for (const item of ready) {
      const version = item.version || ''
      byVersion.set(version, [...(byVersion.get(version) || []), item.id])
    }

    let approved = 0
    for (const [version, ids] of byVersion) {
      for (let at = 0; at < ids.length; at += 100) {
        const chunk = ids.slice(at, at + 100)
        const { error } = await admin.from('operational_documents').update({
          status: 'approved',
          approved_by: actor.id,
          approved_by_name: actor.email || null,
          approved_at: now,
          approved_version: version || null,
          updated_at: now,
        }).in('id', chunk)
        // Reported with what did land rather than as a bare failure. Half a
        // library signed off and a red box saying nothing is worse than half
        // a library signed off and a number.
        if (error) {
          return NextResponse.json({
            error: `${error.message} ${approved} were signed off before it stopped.`,
          }, { status: 500 })
        }
        approved += chunk.length
      }
    }

    // Said in full, including what was refused and why. A count that reports
    // only the successes is how nine empty documents came to be signed off.
    const held: string[] = []
    if (lifeSafety) held.push(`${lifeSafety} life safety ${lifeSafety === 1 ? 'document' : 'documents'}, which need signing one at a time against the premises`)
    if (unwritten) held.push(`${unwritten} not written yet`)
    if (incomplete) held.push(`${incomplete} still missing something`)
    if (badReference) held.push(`${badReference} with a reference that is not in the house format`)

    return NextResponse.json({
      success: true,
      approved,
      lifeSafety,
      note: approved
        ? `${approved} signed off.${held.length ? ` Held back: ${held.join('; ')}.` : ''}`
        : `Nothing signed off.${held.length ? ` Held back: ${held.join('; ')}.` : ' There were no drafts waiting.'}`,
    })
  }

  // Taking charge of a batch that was started but never written down.
  //
  // Two runs of three hundred and thirty-eight were submitted and paid for
  // while the register could not be written to, and their ids went with the
  // warning nobody was shown. They still exist at the provider, and the ids
  // are in the Anthropic console. Pasting one here adopts it, so the work is
  // collected rather than paid for twice and abandoned.
  if (action === 'adopt_batch') {
    const providerBatchId = String(body.providerBatchId || '').trim()
    if (!/^[A-Za-z0-9_-]{8,120}$/.test(providerBatchId)) {
      return NextResponse.json({ error: 'That does not look like a batch id. Copy it from the Anthropic console.' }, { status: 400 })
    }

    const { data: known } = await admin.from('document_batches')
      .select('id').eq('provider_batch_id', providerBatchId).maybeSingle()
    if (known?.id) return NextResponse.json({ error: 'That batch is already in the register.' }, { status: 400 })

    const { error } = await admin.from('document_batches').insert({
      provider_batch_id: providerBatchId,
      tier: ['day-1', 'month-1', 'quarter-1'].includes(String(body.tier || '')) ? String(body.tier) : null,
      requested: 0,
      submitted_by: actor.id,
      status: 'submitted',
      note: 'Adopted by hand after the register could not be written to at submission.',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, note: 'Adopted. Press Collect what is ready to bring it in.' })
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

    // Nothing to read, so nothing to approve. Said before the completeness
    // rules, because they answer a different question and one of them once
    // answered this one wrongly.
    if (!row.document || !Object.keys(row.document).length) {
      return NextResponse.json({
        error: 'There is nothing in that one yet. An approval says somebody read a finished document, '
          + 'and there is nothing to read.',
      }, { status: 400 })
    }

    // Refused while anything is missing. An approval is a statement that
    // somebody read a finished document, and a half-finished one being signed
    // off is exactly the failure this whole flow exists to prevent.
    const missing = missingFor(row.kind, row.document)
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

    // "That one took too long. Try it again" is a dead end dressed as advice:
    // the request is bounded at twenty-six seconds by the host and a document
    // of this length does not reliably fit, so trying again mostly fails
    // again. A batch has no such ceiling, so a call that ran out of time is
    // sent as a batch of one instead and collected like any other.
    if (!result.ok && result.timedOut && batchingConfigured()) {
      const reservation = `pending-${crypto.randomUUID()}`
      const { data: receipt } = await admin.from('document_batches').insert({
        provider_batch_id: reservation, tier: row.tier || null, requested: 1,
        submitted_by: actor.id, status: 'submitted',
      }).select('id').maybeSingle()

      const sent = await submitDraftBatch([{
        id: row.id, title: row.title, reference: row.reference, department: row.department || '',
      }])

      if (!sent.ok) {
        if (receipt?.id) await admin.from('document_batches').delete().eq('id', receipt.id)
        return NextResponse.json({ error: `${result.error} Sending it the slower way also failed: ${sent.error}` }, { status: 502 })
      }

      // The id, saved against the reservation. If this does not save, the
      // run exists at the provider and nothing here knows how to reach it,
      // which is precisely how five batches were paid for and abandoned. So
      // the id goes on screen where she can adopt it by hand.
      const { error: idError } = receipt?.id
        ? await admin.from('document_batches')
          .update({ provider_batch_id: sent.batchId, updated_at: new Date().toISOString() }).eq('id', receipt.id)
        : { error: { message: 'the receipt was never created' } as any }

      if (idError) {
        return NextResponse.json({
          success: true, queued: true,
          warning: 'It has been sent the slower way, but its id could not be saved, so nothing here can find it. '
            + `Write this down and use Collect a batch by id: ${sent.batchId}`,
        })
      }

      return NextResponse.json({
        success: true, queued: true,
        note: 'That one is too long to write inside a web request, so it has been sent the slower way. '
          + 'Come back in a few minutes and press Collect what is ready.',
      })
    }

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
