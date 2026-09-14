import { documentFromDraft } from './assemble'
import type { SopDocument } from './types'

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
  /** Rows deliberately left alone: gone, approved, or already written. */
  skipped: number
}

export function planCollection(
  results: CollectResult[],
  targets: Map<string, Record<string, any>>,
  now: string,
): CollectPlan {
  const writes: Record<string, any>[] = []
  const refused: string[] = []
  let failed = 0
  let skipped = 0

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
    // Gone, signed off, or written by a person while the batch was running.
    // None of those are ours to overwrite.
    if (!target || target.status === 'approved') { skipped += 1; continue }
    if (Object.keys(target.document || {}).length > 0) { skipped += 1; continue }

    writes.push({
      ...target,
      document: documentFromDraft(target as any, result.draft),
      status: 'draft',
      updated_at: now,
    })
  }

  return { writes, failed, refused, skipped }
}
