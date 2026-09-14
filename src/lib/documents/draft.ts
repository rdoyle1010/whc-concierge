import Anthropic from '@anthropic-ai/sdk'
import type { SopDocument } from './types'
import { isLifeSafety } from './safety'

// Drafting a procedure from its title.
//
// What this is and is not. It is a structure: the steps somebody in that role
// actually performs, each with a standard an auditor could check, the roles
// responsible, the terms defined, the ways it goes wrong. It is not a
// finished document and it never leaves here as one, because it has never
// seen the building. Every draft lands as draft, and the sign-off is a person
// reading it.
//
// Sonnet, for the reason every other model choice on this platform is made:
// a better procedure that arrives after the function is killed at twenty-six
// seconds is not a better procedure.

export const DRAFT_MODEL = 'claude-sonnet-5'
const CALL_TIMEOUT_MS = 20000
// Smaller than it was, because the first real run timed out.
//
// A structured response is produced in one pass and a long one does not
// arrive any earlier for being good. Seven steps is a procedure; nine is the
// same procedure with two steps that could have been one, and the difference
// between them was the difference between a document and an error message.
const MAX_OUTPUT_TOKENS = 2800

export function draftingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'purpose', 'scope', 'equipment', 'whyItMatters', 'measuredBy',
    'responsibilities', 'steps', 'commonFailures', 'definitions',
  ],
  properties: {
    purpose: { type: 'string', description: 'One or two sentences. What this procedure exists to achieve.' },
    scope: { type: 'string', description: 'Which roles it applies to and which situations it covers.' },
    equipment: { type: 'array', items: { type: 'string' }, description: 'Systems, documents and equipment needed. Four to six.' },
    whyItMatters: { type: 'string', description: 'One or two sentences on what it costs when this is not done. Concrete, not motivational.' },
    measuredBy: {
      type: 'array', items: { type: 'string' },
      description: 'Three ways somebody would know whether this is being followed. Observable, and countable where they can be.',
    },
    responsibilities: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['role', 'responsibility'],
        properties: { role: { type: 'string' }, responsibility: { type: 'string' } },
      },
      description: 'Two to four roles. Who does it, who checks it, who owns it.',
    },
    steps: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'action', 'standard'],
        properties: {
          name: { type: 'string', description: 'Short imperative name for the step.' },
          action: { type: 'string', description: 'What the person does, in enough detail to follow without being told.' },
          standard: { type: 'string', description: 'The standard the step must meet, written so somebody could audit it.' },
        },
      },
      description: 'Five to seven steps in the order they happen, and no more. Every one needs a standard: a step with an action and no standard is a description, not a procedure.',
    },
    commonFailures: {
      type: 'array', items: { type: 'string' },
      description: 'Three ways this goes wrong in a real spa on a busy day. What a trainer would say out loud.',
    },
    definitions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['term', 'meaning'],
        properties: { term: { type: 'string' }, meaning: { type: 'string' } },
      },
      description: 'Three or four terms a new starter would not know.',
    },
  },
} as const

const SYSTEM = `You write standard operating procedures for luxury spa and wellness operations, for Talent House Collective.

Who reads these: a spa receptionist, therapist, pool attendant or manager, being trained against the document and then audited on it. Write for somebody competent who is new to this property.

How they read:
- British English. Every time.
- Plain, direct, specific. Instructions, not prose.
- Never use an em dash. Use a comma, a full stop, or a short dash with spaces.
- No exclamation marks, no markdown, no headings inside a field.
- Never use: passionate, dynamic, vibrant, world-class, seamless, journey, elevate, ensure that you, it is important to.

What you may and may not state:
- Every step needs a standard somebody could audit. "Done promptly" is not a standard. "Within fifteen minutes of the guest leaving, recorded on the log" is.
- Never invent a fact about a specific building: no room numbers, no muster points, no named people, no equipment models, no chemical product names, no phone numbers, no local regulations by number.
- Where the procedure needs a fact only the property has, write it as a placeholder in square brackets, for example [muster point] or [duty manager contact]. A placeholder is honest. An invented fact is not.
- Do not cite legislation by name or section unless the title of the document names it. Say what must happen, not which act requires it.
- Timings, frequencies and thresholds should be stated where there is a sensible industry norm, and left as a placeholder where there is not.

Return the structured object and nothing else.`

export async function draftDocument(input: {
  title: string
  reference: string
  department: string
  /** Anything true about the property, where this is being drafted for one. */
  context?: Record<string, unknown>
}): Promise<{ ok: true; draft: Partial<SopDocument> } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'Talent House AI is not switched on for this deployment.' }

  const safety = isLifeSafety(input)
  const facts = Object.entries(input.context || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.slice(0, 30).join(', ') : String(value).slice(0, 300)}`)
    .join('\n')

  const client = new Anthropic({ apiKey, maxRetries: 0 })

  try {
    const response = await client.messages.create({
      model: DRAFT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM,
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA as any },
      },
      messages: [{
        role: 'user',
        content: `Draft the procedure "${input.title}".

Reference: ${input.reference}
Department: ${input.department}
${safety
  ? '\nThis is a life safety procedure. Be conservative: state what must happen and who must be competent to do it, and use a placeholder for every fact about the building. Do not describe an evacuation route, a muster point or a plant room, because you do not know this one.\n'
  : ''}
${facts ? `\nWhat is true about the property:\n${facts}\n` : ''}`,
      }],
    }, { timeout: CALL_TIMEOUT_MS })

    if (response.stop_reason === 'refusal') {
      return { ok: false, error: 'The model declined to draft that one. Write it by hand.' }
    }

    const block = response.content.find(item => item.type === 'text')
    if (!block || block.type !== 'text') return { ok: false, error: 'Nothing usable came back. Try again.' }

    const raw = JSON.parse(block.text)

    // The house rule, enforced rather than requested. A model asked nicely not
    // to use an em dash will use one eventually, and this platform fails its
    // own readiness check over a single one.
    const clean = (value: unknown): any => {
      if (typeof value === 'string') return value.replace(/[\u2014\u2013]/g, ' - ').trim()
      if (Array.isArray(value)) return value.map(clean)
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, clean(inner)]))
      }
      return value
    }

    return { ok: true, draft: clean(raw) as Partial<SopDocument> }
  } catch (error: any) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'The Anthropic API key on this deployment was refused. Check it in Netlify.' }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: 'Too many at once. Wait a minute and carry on.' }
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return { ok: false, error: 'That one took too long. Try it again.' }
    }
    return { ok: false, error: error?.message || 'That could not be drafted just now.' }
  }
}
