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
 * Two models, because two different jobs are being paid for.
 *
 * AI_MODEL writes prose a person reads and judges: a bio, a headline, a job
 * advert, a message to a candidate. That is the platform's voice, it is short,
 * and it is worth the better model.
 *
 * AI_MODEL_READING reads a long document and returns a shape: a CV into
 * profile fields, a CV and a job advert into interview questions, an
 * application into an analysis. Almost all of the tokens are input, nobody
 * reads the model's sentences, and the cheaper model is not detectably worse
 * at pulling facts out of a document.
 *
 * The split is not an emergency measure. The first fortnight's bill was read
 * carefully before writing this: almost all of it was one day, one batch, and
 * the document library being drafted, which is not the live site and does not
 * repeat. The live surfaces cost pennies. This is here because paying the
 * better model to pull dates out of a CV was never the right trade, not
 * because anything is on fire.
 *
 * Both are overridable from Netlify, which takes effect on the next deploy
 * rather than immediately: Netlify reads environment variables into a function
 * when it builds it, so changing one and not deploying changes nothing.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'
export const AI_MODEL_READING = process.env.ANTHROPIC_MODEL_READING || 'claude-sonnet-5'

/** Which job this is. Picks the model, and nothing else. */
export type AiTier = 'writing' | 'reading'

export function modelFor(tier: AiTier): string {
  return tier === 'reading' ? AI_MODEL_READING : AI_MODEL
}

/**
 * What a call actually cost, in the logs, named.
 *
 * The bill arrived as one number for eight surfaces and the only way to guess
 * which one spent it was to read the code and estimate. That is not a
 * diagnosis, it is a hunch. Every call now says what it was and what it used,
 * so the next time the number looks wrong the Netlify function log answers it.
 */
export function logUsage(label: string, model: string, usage: { input_tokens?: number; output_tokens?: number } | null | undefined) {
  const input = usage?.input_tokens ?? 0
  const output = usage?.output_tokens ?? 0
  console.log(`[AI spend] ${label} model=${model} in=${input} out=${output}`)
}

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
  /** What this call is, for the spend log. Short, and the same every time. */
  label: string
  /** Writing prose, or reading a document. Picks the model. */
  tier?: AiTier
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
export async function askForText({ label, tier = 'writing', prompt, system, maxTokens, effort = 'low' }: Ask): Promise<AiResult> {
  if (!aiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED }
  const model = modelFor(tier)
  try {
    const response = await client().messages.create({
      model,
      max_tokens: maxTokens,
      output_config: { effort },
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: TIMEOUT_MS })

    logUsage(label, model, response.usage)

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
export async function askForJson<T>({ label, tier = 'reading', prompt, system, maxTokens, effort = 'low' }: Ask): Promise<
  { ok: true; data: T } | { ok: false; error: string }
> {
  const result = await askForText({
    label, tier,
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
