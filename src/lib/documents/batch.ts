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
          thinking: { type: 'disabled' as const },
          output_config: { format: { type: 'json_schema' as const, schema: DRAFT_SCHEMA as any } },
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

export type BatchProgress =
  | { ok: true; ready: false; status: string }
  | { ok: true; ready: true; results: { id: string; draft: Partial<SopDocument> | null; error: string | null }[] }
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
    if (batch.processing_status !== 'ended') {
      return { ok: true, ready: false, status: batch.processing_status }
    }

    const results: { id: string; draft: Partial<SopDocument> | null; error: string | null }[] = []
    for await (const entry of await client.messages.batches.results(batchId)) {
      const id = entry.custom_id

      if (entry.result.type !== 'succeeded') {
        results.push({ id, draft: null, error: `The model run ${entry.result.type}.` })
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

    return { ok: true, ready: true, results }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'That batch could not be read.' }
  }
}
