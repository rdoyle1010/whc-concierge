import Anthropic from '@anthropic-ai/sdk'

// One AI client, one key, one bill.
//
// This platform called two providers. The profile writer and the CV reader
// went to Anthropic with the official SDK; the job advert, the three
// application routes, the certificate helper and both interview-ready routes
// went to OpenAI through six separate hand-written fetch calls, each with its
// own timeout, its own response unwrapping and its own idea of what an error
// looks like. Two keys, two invoices, and a platform where half the AI could
// be dead while the other half worked, depending on which environment variable
// was missing.
//
// It is one now. Everything here, one key, one model constant, and the SDK
// rather than fetch, so retries, timeouts and typed errors come from a library
// that is maintained rather than from six copies of the same twenty lines.

/**
 * The model, in one place.
 *
 * Opus for quality, because the question asked was which provider gives the
 * best rather than which is cheapest. It is roughly two and a half times the
 * token price of Sonnet, and at this platform's volumes that is a difference
 * of pennies a day. If it ever stops being pennies, or if a route starts
 * timing out, set ANTHROPIC_MODEL in Netlify to claude-sonnet-5 and everything
 * moves together. No deploy.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'

/**
 * Netlify kills a synchronous function at twenty-six seconds.
 *
 * Eighteen leaves room to return an answer, or to return a useful error, which
 * is the part that used to be lost: the function died, the browser saw a
 * generic failure, and the person was told to try again by a page that had no
 * idea what had happened.
 */
const TIMEOUT_MS = 18000

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** The one message every surface uses when the key is missing. */
export const AI_NOT_CONFIGURED =
  'Talent House AI is not switched on for this deployment. ANTHROPIC_API_KEY is not set.'

function client(): Anthropic {
  // Retries off. These all run inside a twenty-six second ceiling, and a
  // second attempt that lands at twenty-four seconds is a second attempt
  // nobody receives.
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 0 })
}

type Ask = {
  /** The instruction. */
  prompt: string
  /** Rules that do not change between calls, cached across requests. */
  system?: string
  maxTokens: number
  /**
   * How hard to think about it.
   *
   * Low for everything here by default: these are short, well specified jobs
   * against a fixed shape, not problems to work out. Thinking is deliberately
   * left on rather than disabled, because on Opus disabling it has two known
   * failure modes: the model occasionally writes a tool call into the visible
   * text where nothing runs it, and it can leak internal tags into the answer.
   * Low effort costs less than disabled thinking used to and does neither.
   */
  effort?: 'low' | 'medium' | 'high'
}

export type AiResult =
  | { ok: true; text: string }
  | { ok: false; error: string }

/**
 * Ask for prose. Never throws.
 *
 * The caller is a person looking at a button that did not work, and a stack
 * trace is not an answer to "why is this button not working". Every failure
 * comes back as a sentence that says what to do about it.
 */
export async function askForText({ prompt, system, maxTokens, effort = 'low' }: Ask): Promise<AiResult> {
  if (!aiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED }
  try {
    const response = await client().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      output_config: { effort },
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: TIMEOUT_MS })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim()

    if (!text) return { ok: false, error: 'The assistant returned nothing. Try again in a moment.' }
    return { ok: true, text }
  } catch (caught: any) {
    return { ok: false, error: readableFailure(caught) }
  }
}

/**
 * Ask for JSON, and get an object or a reason. Never throws.
 *
 * The model is asked for JSON and then the answer is parsed defensively
 * anyway, because a model told to return only JSON will occasionally wrap it
 * in a code fence, and a route that assumes otherwise fails on a Tuesday.
 */
export async function askForJson<T>({ prompt, system, maxTokens, effort = 'low' }: Ask): Promise<
  { ok: true; data: T } | { ok: false; error: string }
> {
  const result = await askForText({
    prompt: `${prompt}\n\nReturn only valid JSON. No preamble, no code fence, no explanation.`,
    system, maxTokens, effort,
  })
  if (!result.ok) return result

  const fenced = result.text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = (fenced ? fenced[1] : result.text).trim()
  // The first { or [ onwards, for the case where a sentence arrived first.
  const start = body.search(/[[{]/)
  try {
    return { ok: true, data: JSON.parse(start > 0 ? body.slice(start) : body) as T }
  } catch {
    return { ok: false, error: 'The assistant returned something that was not readable. Try again.' }
  }
}

/**
 * What went wrong, said to a person rather than to a log.
 *
 * Six routes each had their own version of this and three of them said "AI is
 * not configured yet", which is true of exactly one cause and useless for the
 * other four.
 */
function readableFailure(caught: any): string {
  if (caught instanceof Anthropic.AuthenticationError) {
    return 'Talent House AI rejected the key for this deployment. Check ANTHROPIC_API_KEY in Netlify.'
  }
  if (caught instanceof Anthropic.RateLimitError) {
    return 'That is a lot of requests at once. Give it a minute and try again.'
  }
  if (caught?.name === 'APIConnectionTimeoutError' || /timeout|aborted/i.test(String(caught?.message || ''))) {
    return 'That took too long and was stopped before it could finish. Try again, or shorten what you gave it.'
  }
  if (caught instanceof Anthropic.APIError) {
    console.error('[AI]', caught.status, caught.message)
    return 'The assistant could not answer that just now. Nothing has been saved. Try again shortly.'
  }
  console.error('[AI]', caught?.message || caught)
  return 'The assistant could not answer that just now. Nothing has been saved. Try again shortly.'
}
