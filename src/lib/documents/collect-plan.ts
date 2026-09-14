import { documentFromDraft } from './assemble'
import { missingFromSop, type SopDocument } from './types'

// Working out what to write before writing any of it.
//
// The first version of collection did two database round trips per document:
// read it, then update it. Three hundred and thirty-eight documents is six
// hundred and seventy-six sequential calls, which does not fit inside the
// twenty-six seconds the host allows, and a batch that cannot be collected
// inside one request is a batch that has been paid for and cannot be reached.
//
// So the decision is separated from the writing. This function is given the
// results and the rows they belong to and returns the finished rows, which
// the caller saves in a handful of bulk writes rather than hundreds of
// single ones. It touches nothing, which also means it can be tested without
// a database, which is where the rules below actually matter.

export type CollectResult = {
  id: string
  draft: Partial<SopDocument> | null
  error: string | null
}

export type CollectPlan = {
  /** Whole rows, ready to be saved back. */
  writes: Record<string, any>[]
  /** Results the model did not produce a document for. */
  failed: number
  /** The first few reasons, verbatim. */
  refused: string[]
  /** Rows deliberately left alone: gone, approved, finished, or not improved. */
  skipped: number
  /** Unfinished drafts this run replaced with a better one. */
  improved: number
}

export function planCollection(
  results: CollectResult[],
  targets: Map<string, Record<string, any>>,
  now: string,
  /**
   * Whether this run is allowed to replace a document that is already there
   * but unfinished.
   *
   * Off by default, and that default is the important half. An incomplete
   * document is indistinguishable from one a person started writing by hand,
   * so nothing written is ever overwritten by an ordinary collection. Only a
   * run that was deliberately sent to redraft the unfinished ones may, and
   * even then only with something more complete.
   */
  options: { replaceUnfinished?: boolean } = {},
): CollectPlan {
  const writes: Record<string, any>[] = []
  const refused: string[] = []
  let failed = 0
  let skipped = 0
  let improved = 0

  for (const result of results) {
    if (!result.draft) {
      failed += 1
      // Four hundred identical errors is one problem. Reporting it as a
      // number she cannot act on is how an afternoon gets spent pressing a
      // button, so the provider's own words come back with it.
      if (result.error && refused.length < 3 && !refused.includes(result.error)) refused.push(result.error)
      continue
    }

    const target = targets.get(result.id)
    // Gone, or signed off. Neither is ours to overwrite: an approval says
    // somebody read that exact version.
    if (!target || target.status === 'approved') { skipped += 1; continue }

    const written = documentFromDraft(target as any, result.draft)

    // Something is already there. An ordinary collection leaves it alone,
    // full stop: an incomplete document and a document somebody started by
    // hand look identical from here.
    //
    // A first draft that came back with no steps in it was stored as written
    // anyway, which is how a dozen documents ended up unsignable while the
    // register reported nothing left to write. Redrafting those is the fix,
    // and the old rule of never overwriting anything written would have
    // skipped every one of them and charged for the privilege.
    //
    // So an unfinished draft can be replaced, and only by a better one.
    // Nothing is ever replaced with something worse, and a document a person
    // has completed by hand is finished by definition and left alone.
    if (Object.keys(target.document || {}).length > 0) {
      if (!options.replaceUnfinished) { skipped += 1; continue }
      const before = missingFromSop(target.document as SopDocument)
      if (!before.length) { skipped += 1; continue }
      if (missingFromSop(written as SopDocument).length >= before.length) { skipped += 1; continue }
      improved += 1
    }

    writes.push({
      ...target,
      document: written,
      status: 'draft',
      updated_at: now,
    })
  }

  return { writes, failed, refused, skipped, improved }
}
