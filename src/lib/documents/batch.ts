import Anthropic from '@anthropic-ai/sdk'
import { DRAFT_SCHEMA, DRAFT_SYSTEM, draftPrompt, cleanDraft, DRAFT_MODEL } from './draft'
import type { SopDocument } from './types'

// Four hundred and sixty documents, submitted once.
//
// Drafting one inside a web request was the wrong shape from the beginning.
// It is bounded by a twenty-six second ceiling, it costs a click each, and
// four hundred and sixty clicks at fifteen seconds apiece is an afternoon of
// somebody watching a spinner to find out whether a spa platform can write.
//
// A batch has no request timeout over it, runs while she does something else,
// and costs half. The only thing it asks in return is that the work is not
// needed in the next few seconds, which is true of every document here.

export type BatchItem = {
  /** Our row id, returned untouched so results can be matched back. */
  id: string
  title: string
  reference: string
  department: string
}

export function batchingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** Submit them all. Returns the provider's id for the run. */
export async function submitDraftBatch(items: BatchItem[]): Promise<
  { ok: true; batchId: string; count: number } | { ok: false; error: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'Talent House AI is not switched on for this deployment.' }
  if (!items.length) return { ok: false, error: 'There is nothing left to draft in that tier.' }

  const client = new Anthropic({ apiKey })

  try {
    const batch = await client.messages.batches.create({
      requests: items.map(item => ({
        // The row id, so a result can be matched back to its document. Results
        // come back in any order, so this is the only thing joining them.
        custom_id: item.id,
        params: {
          model: DRAFT_MODEL,
          max_tokens: 2800,
          system: DRAFT_SYSTEM,
          // Low effort rather than thinking disabled: disabled is a
          // documented trap on Opus, where the model can write a tool call
          // into its visible text or leak internal tags. This is a batch, so
          // it is also the cheapest place on the platform to be careful.
          output_config: {
            effort: 'low' as const,
            format: { type: 'json_schema' as const, schema: DRAFT_SCHEMA as any },
          },
          messages: [{ role: 'user' as const, content: draftPrompt(item) }],
        },
      })),
    })
    return { ok: true, batchId: batch.id, count: items.length }
  } catch (error: any) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'The Anthropic API key on this deployment was refused. Check it in Netlify.' }
    }
    return { ok: false, error: error?.message || 'That batch could not be submitted.' }
  }
}

/** What the provider says about the run itself, before any result is read. */
export type BatchCounts = {
  processing: number
  succeeded: number
  errored: number
  canceled: number
  expired: number
}

export type BatchProgress =
  | { ok: true; ready: false; status: string; counts: BatchCounts }
  | { ok: true; ready: true; counts: BatchCounts; results: { id: string; draft: Partial<SopDocument> | null; error: string | null }[] }
  | { ok: false; error: string }

/**
 * Where the run has got to, and its results once it has finished.
 *
 * Deliberately two states rather than a promise that resolves eventually. A
 * batch takes minutes to hours, which is longer than any request that asks
 * about it, so the honest answer while it is running is "still running".
 */
export async function collectDraftBatch(batchId: string): Promise<BatchProgress> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'Talent House AI is not switched on for this deployment.' }
  const client = new Anthropic({ apiKey })

  try {
    const batch = await client.messages.batches.retrieve(batchId)

    // What the provider itself says, before a single result is read.
    //
    // Without this, a run in which every request failed and a run still
    // working through its queue are the same thing on screen: nothing came
    // back. They need completely different responses from her, and only one
    // of them is worth waiting for.
    const raw: any = (batch as any).request_counts || {}
    const counts: BatchCounts = {
      processing: Number(raw.processing || 0),
      succeeded: Number(raw.succeeded || 0),
      errored: Number(raw.errored || 0),
      canceled: Number(raw.canceled || 0),
      expired: Number(raw.expired || 0),
    }

    if (batch.processing_status !== 'ended') {
      return { ok: true, ready: false, status: batch.processing_status, counts }
    }

    const results: { id: string; draft: Partial<SopDocument> | null; error: string | null }[] = []
    for await (const entry of await client.messages.batches.results(batchId)) {
      const id = entry.custom_id

      if (entry.result.type !== 'succeeded') {
        // The provider's own words. "The model run errored" is a sentence
        // that sends somebody to ask a person what it means, and the person
        // has to go and look it up anyway.
        const detail: any = (entry.result as any).error
        const said = detail?.error?.message || detail?.message || ''
        results.push({
          id,
          draft: null,
          error: said ? `${entry.result.type}: ${said}` : `The model run ${entry.result.type}.`,
        })
        continue
      }

      const message = entry.result.message
      if (message.stop_reason === 'refusal') {
        results.push({ id, draft: null, error: 'The model declined this one. Write it by hand.' })
        continue
      }

      const block = message.content.find(item => item.type === 'text')
      if (!block || block.type !== 'text') {
        results.push({ id, draft: null, error: 'Nothing usable came back for this one.' })
        continue
      }

      try {
        results.push({ id, draft: cleanDraft(JSON.parse(block.text)), error: null })
      } catch {
        results.push({ id, draft: null, error: 'That answer was not readable.' })
      }
    }

    return { ok: true, ready: true, counts, results }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'That batch could not be read.' }
  }
}
