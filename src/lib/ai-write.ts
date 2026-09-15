import Anthropic from '@anthropic-ai/sdk'
import { HOUSE_RULES } from './house-style'
import { AI_MODEL, logUsage } from './ai'

// The blank box, answered.
//
// Every account type on this platform has one field that decides whether
// anybody reads the rest of it, and every one of them is left empty. A
// therapist's About you. A property's description. A role's description. They
// are left empty for the same reason: writing two hundred words about
// yourself, well, in a box, is genuinely hard, and nobody joined a spa
// platform to do it.
//
// So it is written here, from what they have already told us and nothing
// else, and offered as a draft they read, edit and approve. Never saved by
// itself. It is not deciding anything about anybody; it is doing the typing.

export type WriteField =
  | 'talent_bio'
  | 'talent_headline'
  | 'talent_commercial'
  | 'employer_about'
  | 'employer_tagline'
  | 'job_description'
  | 'property_policy'
  | 'practice_headline'
  | 'practice_about'
  | 'practice_work'
  | 'practice_outcome'

export type WriteMode = 'write' | 'improve'

export const WRITE_FIELDS: WriteField[] = [
  'talent_bio', 'talent_headline', 'talent_commercial',
  'employer_about', 'employer_tagline', 'job_description', 'property_policy',
  'practice_headline', 'practice_about', 'practice_work', 'practice_outcome',
]

export function isWriteField(value: unknown): value is WriteField {
  return WRITE_FIELDS.includes(value as WriteField)
}

// Sonnet, for the same reason the CV reader is. A synchronous function here
// is killed at twenty-six seconds and a better paragraph that arrives after
// that is not a better paragraph.
export const WRITE_MODEL = AI_MODEL
const CALL_TIMEOUT_MS = 18000

type Shape = {
  /** What it is, in the words the person sees on their own screen. */
  label: string
  /** Roughly how long, said to the model and shown to the person. */
  length: string
  /**
   * The ceiling for thinking AND the answer together, which is the part that
   * was got wrong.
   *
   * These were first sized against the answer alone: two hundred tokens for a
   * hundred-and-twenty-character headline is generous if a headline is all
   * that is being paid for. It is not. Thinking runs inside the same budget,
   * so the model spent most of it reasoning and the headline was cut off mid
   * word, which is how "Authored Mandarin Oriental & Fairmont S" reached
   * somebody's profile. The short fields are the ones that break, because they
   * were given the least room and the thinking does not get shorter just
   * because the answer is.
   *
   * Every field now has room for both. Unused tokens are not billed, so the
   * headroom costs nothing and the truncation costs a draft.
   */
  maxTokens: number
  /** Whose voice it is written in. */
  voice: string
}

const SHAPES: Record<WriteField, Shape> = {
  talent_bio: {
    label: 'About you',
    length: 'eighty to a hundred and thirty words',
    maxTokens: 1600,
    voice: 'the first person, as she would introduce herself to a spa director she respects',
  },
  talent_headline: {
    label: 'Your headline',
    length: 'one line, under a hundred and twenty characters',
    maxTokens: 1200,
    voice: 'the third person as a title, with no full stop',
  },
  employer_about: {
    label: 'About the property',
    length: 'a hundred to a hundred and sixty words',
    maxTokens: 1800,
    voice: 'the property speaking about itself, warm and specific, never a brochure',
  },
  employer_tagline: {
    label: 'Tagline',
    length: 'one line, under ninety characters',
    maxTokens: 1200,
    voice: 'a plain statement of what this place is, with no full stop',
  },
  job_description: {
    label: 'The role',
    length: 'a hundred and fifty to two hundred and fifty words',
    maxTokens: 2200,
    voice: 'the property addressing the person who might take the job, as "you"',
  },
  talent_commercial: {
    label: 'Commercial experience',
    length: 'forty to eighty words',
    maxTokens: 1400,
    voice: 'the first person, plainly, about money and teams she has actually been responsible for',
  },
  // One shape for every box in the Property Fact File. They are all the same
  // job - a property telling a worker who arrives on Tuesday how this place
  // does something - and twelve near-identical entries here would drift apart
  // within a month. Which box it is arrives as the subject.
  property_policy: {
    label: 'This section',
    length: 'thirty to a hundred words, whichever the subject actually needs',
    maxTokens: 1500,
    voice: 'the property telling a worker arriving for a shift what to do, direct and unfussy',
  },
  practice_headline: {
    label: 'Practice headline',
    length: 'one line, under a hundred and twenty characters',
    maxTokens: 1200,
    voice: 'a plain claim about what this consultancy does, with no full stop',
  },
  practice_about: {
    label: 'About the practice',
    length: 'a hundred and twenty to two hundred words',
    maxTokens: 1900,
    voice: 'the first person, as the consultant would describe her own practice to a hotel owner',
  },
  practice_work: {
    label: 'What the work was',
    length: 'sixty to a hundred and twenty words',
    maxTokens: 1500,
    voice: 'the first person, past tense: the brief, the state she found it in, what she did',
  },
  practice_outcome: {
    label: 'What changed',
    length: 'one or two sentences, no more',
    maxTokens: 1300,
    voice: 'a flat statement of the outcome, numbers first where there are numbers',
  },
}

export function writeFieldLabel(field: WriteField): string {
  return SHAPES[field].label
}

const HOUSE_STYLE = `You write for Talent House Collective, a register of spa and wellness professionals and the luxury properties that hire them.

${HOUSE_RULES}

Two more, for a profile specifically:
- Do not open with the person's or property's name, and do not open with "With over".
- If keeping every earned claim makes the text longer than the length asked for, keep the claims and cut the description around them.

Return the finished text and nothing else. No preamble, no quotation marks around it, no explanation.`

export function writingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export type WriteRequest = {
  field: WriteField
  mode: WriteMode
  /** What they have written already. Required for 'improve'. */
  draft?: string
  /** Everything true about them, gathered on the server from their own record. */
  facts: Record<string, unknown>
  /** In their own words: what they want said, or what is wrong with the draft. */
  steer?: string
  /** Which box this is, where one shape serves many. */
  subject?: string | null
}

function factLines(facts: Record<string, unknown>): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(facts)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      lines.push(`${key}: ${value.slice(0, 40).join(', ')}`)
      continue
    }
    lines.push(`${key}: ${String(value).slice(0, 600)}`)
  }
  return lines.join('\n')
}

/**
 * The exact prompt this platform sends, built without sending it.
 *
 * Pulled out of writeText so it can be handed to something other than the
 * Anthropic client: a test that reads what is actually asked for, and
 * scripts/compare-writers.ts, which puts the identical prompt to two providers
 * so a choice between them is a judgement about the answers rather than about
 * the vendors. A comparison where each side gets a slightly different prompt
 * measures the prompts.
 */
export function buildWriteRequest(request: WriteRequest):
  | { ok: true; system: string; prompt: string; maxTokens: number }
  | { ok: false; error: string } {
  const shape = SHAPES[request.field]
  const facts = factLines(request.facts)
  if (!facts.trim() && !String(request.draft || '').trim()) {
    return {
      ok: false,
      error: 'There is not enough on your profile yet for this to be worth writing. Fill in a few of the fields above first, then come back to it.',
    }
  }

  const steer = String(request.steer || '').trim().slice(0, 500)
  const draft = String(request.draft || '').trim().slice(0, 4000)

  const subject = String(request.subject || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const named = subject || shape.label

  const task = request.mode === 'improve' && draft
    ? `Rewrite the draft below so it reads better. Keep every fact in it, keep the person's own voice and anything distinctive about how they put things, and cut what is padding. Do not add facts that are not in the draft or the details underneath it.

Their draft:
${draft}`
    : draft
      ? `Write the "${named}" fresh. They have asked for a different one, so do not keep their wording or their structure.

Their current version is below. It is not prose to preserve, it is a source of facts. Every award, title, qualification, named brand, number and year in it is something they have earned and must appear in yours. Losing one of those is the failure this instruction exists to prevent.

Their current version:
${draft}`
      : `Write the "${named}" from the details below. There is nothing written yet.`

  return {
    ok: true,
    system: HOUSE_STYLE,
    maxTokens: shape.maxTokens,
    prompt: `${task}

This is the "${named}" field.
Length: ${shape.length}.
Voice: ${shape.voice}.
${steer ? `\nWhat they have asked for: ${steer}\n` : ''}
What is true about them:
${facts || '(nothing beyond the draft above)'}`,
  }
}

/**
 * Write it, or write it better. Never throws.
 *
 * The caller is somebody staring at an empty box, and a stack trace is not an
 * answer to "why is this button not working".
 */
/** What a call cost, passed back so the caller can put it against a person. */
export type WriteSpend = { input: number; output: number }

export async function writeText(request: WriteRequest): Promise<
  { ok: true; text: string; spend: WriteSpend } | { ok: false; error: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'Talent House AI is not switched on for this deployment.' }

  const built = buildWriteRequest(request)
  if (!built.ok) return built
  const { system, prompt, maxTokens } = built

  const client = new Anthropic({ apiKey, maxRetries: 0 })

  try {
    const response = await client.messages.create({
      model: WRITE_MODEL,
      max_tokens: maxTokens,
      system,
      // Thinking is left on at low effort rather than disabled.
      //
      // Disabled was the right call on the previous model and is a documented
      // trap on this one: with thinking off it occasionally writes a tool call
      // into its visible text, where nothing runs it and the turn still
      // succeeds, and it can leak internal tags into the answer. Low effort
      // costs less than disabled thinking did and does neither.
      //
      // The job has not changed. This is extraction and rewriting against a
      // fixed shape, not a problem to work out, and it runs inside a
      // twenty-six second ceiling where a better answer that arrives after the
      // function is killed is not a better answer.
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: CALL_TIMEOUT_MS })

    if (response.stop_reason === 'refusal') {
      return { ok: false, error: 'That could not be written. Try putting a little more in the box first.' }
    }

    // A draft that ran out of room is not a draft.
    //
    // This is the defect the small ceilings exposed rather than caused. The
    // model stopped mid word, the text that had arrived was returned as a
    // success, and somebody was shown "Authored Mandarin Oriental & Fairmont
    // S" under a heading that said A DRAFT, FOR YOU TO READ. Half a sentence
    // offered as finished work is worse than an honest failure, because the
    // person cannot tell whether the platform is broken or whether that is
    // genuinely what it thinks of them.
    if (response.stop_reason === 'max_tokens') {
      console.error(`[AI] ${request.field} hit the token ceiling of ${maxTokens}`)
      return { ok: false, error: 'That came out too long and was cut off. Press it again, or shorten what is in the box.' }
    }

    logUsage(`write ${request.field}`, WRITE_MODEL, response.usage)

    const block = response.content.find(item => item.type === 'text')
    const text = block && block.type === 'text' ? block.text.trim() : ''
    if (!text) return { ok: false, error: 'Nothing came back. Try again in a moment.' }

    // The house rules, enforced rather than requested. A model asked nicely
    // not to use an em dash will use one eventually, and this platform fails
    // its own readiness check over a single one.
    const cleaned = text
      .replace(/[\u2014\u2013]/g, ' - ')
      .replace(/^["'“‘]|["'”’]$/g, '')
      .trim()

    return {
      ok: true, text: cleaned,
      spend: {
        input: Number(response.usage?.input_tokens || 0),
        output: Number(response.usage?.output_tokens || 0),
      },
    }
  } catch (error: any) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'The Anthropic API key on this deployment was refused. Check it in Netlify.' }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: 'Too many at once. Wait a minute and try again.' }
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return { ok: false, error: 'That took too long. Try again, and it will usually come back second time.' }
    }
    return { ok: false, error: error?.message || 'That could not be written just now.' }
  }
}
