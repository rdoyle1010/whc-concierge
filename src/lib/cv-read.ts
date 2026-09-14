import Anthropic from '@anthropic-ai/sdk'
import { PRODUCT_HOUSES, QUALIFICATIONS, ROLE_LEVELS, SYSTEMS } from '@/lib/constants'

// Reading a CV into a profile.
//
// This is the bottleneck, and it is worth being precise about which one. It is
// not matching: the platform already scores candidates against roles on
// structured data, deterministically, in a way it can explain to somebody who
// asks why they were not shortlisted. Replacing that with a panel of models
// debating a person would trade an auditable decision for an unauditable one,
// on a regulated subject, and buy nothing.
//
// The bottleneck is getting the structured data in the first place. Fourteen
// people have joined and not one has filled in fifteen fields. Half an hour of
// somebody's evening per profile is why the concierge offer does not scale
// past about twenty people.
//
// So this reads a CV and proposes a filled-in profile. It never saves
// anything: a person reads the draft, corrects it, and only then does it
// exist. That is not caution for its own sake. An automated decision about
// somebody's employment is a regulated thing, and a suggestion a human
// approves is not one.
//
// The taxonomy is the point. The model is not asked what skills somebody has,
// it is asked which of OUR product houses, OUR systems and OUR qualifications
// appear in this CV. Free text would be unmatchable, and the vocabulary is
// where thirty-five years of knowing this industry actually lives.

export type CvReading = {
  full_name: string | null
  headline: string | null
  role_level: string | null
  experience_years: number | null
  bio: string | null
  product_houses: string[]
  systems_experience: string[]
  qualifications: string[]
  treatment_skills: string[]
  business_skills: string[]
  languages: string[]
  current_employer: string | null
  hotel_brands: string[]
  location: string | null
  /** What the CV does not say, so somebody knows what to ask for. */
  gaps: string[]
}

// Sonnet, not Opus.
//
// This is extraction against a fixed vocabulary, not a judgement, and the
// thing that actually decides whether it returns is how fast the tokens come
// out. Opus spent longer than eighteen seconds producing the same object
// three times in a row on a thirty year CV, so an administrator pressed the
// button, waited, and was told to paste the text in instead. A model that
// answers in seven seconds is a better model here than a cleverer one that
// answers after the function has been killed.
export const CV_MODEL = 'claude-sonnet-5'

// The whole request has to finish inside the host's twenty-six second ceiling,
// so the work is cut to fit. Fifteen thousand characters is a long CV several
// times over, and the answer is a short object rather than an essay: three
// thousand output tokens is generous for it and caps the worst case, which is
// what actually decides whether this returns at all.
const MAX_CV_CHARS = 15000
const MAX_OUTPUT_TOKENS = 2200

// Give up before the host does.
//
// A function killed at twenty-six seconds returns an error page rather than
// JSON, and the screen can only say something vague about the server. Abandon
// the call at eighteen and there is time left to fetch the file, pull the text
// out of a Word document and still answer properly, in a sentence that tells
// somebody what to do instead.
const CALL_TIMEOUT_MS = 18000

/** Whether a reading can be attempted at all on this deployment. */
export function cvReadingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'full_name', 'headline', 'role_level', 'experience_years', 'bio',
    'product_houses', 'systems_experience', 'qualifications',
    'treatment_skills', 'business_skills', 'languages', 'current_employer',
    'hotel_brands', 'location', 'gaps',
  ],
  properties: {
    full_name: { type: ['string', 'null'] },
    headline: { type: ['string', 'null'], description: 'One line, under 90 characters. What they are, not what they want.' },
    // A sentinel rather than a nullable enum.
    //
    // `type: ['string','null']` alongside `enum` is rejected outright: the
    // validator will not accept a list of allowed values that does not match
    // the declared type. Every other nullable field here has no enum and is
    // fine. This one carries the vocabulary, so it says Unknown instead of
    // null and is mapped back below.
    role_level: {
      type: 'string',
      enum: [...ROLE_LEVELS, 'Unknown'],
      description: 'Unknown when the CV does not make the level clear. Never guess a level from a job title alone.',
    },
    experience_years: { type: ['integer', 'null'] },
    bio: { type: ['string', 'null'], description: 'Sixty to a hundred words in the first person, as the professional would introduce herself, British English, drawn only from the CV. Write one whenever there is any career history at all: an empty bio is the most expensive field on a profile to leave blank.' },
    product_houses: { type: 'array', items: { type: 'string', enum: [...PRODUCT_HOUSES] } },
    systems_experience: { type: 'array', items: { type: 'string', enum: [...SYSTEMS] } },
    qualifications: { type: 'array', items: { type: 'string', enum: [...QUALIFICATIONS] } },
    treatment_skills: { type: 'array', items: { type: 'string' }, description: 'Treatments they can actually deliver, named as the industry names them. This is what the matching runs on, so be thorough: every facial, massage, body and specialist treatment the CV mentions.' },
    business_skills: { type: 'array', items: { type: 'string' }, description: 'Commercial and management skills the CV evidences: budgeting, rotas, recruitment, retail targets, training, P&L, KPI reporting.' },
    languages: { type: 'array', items: { type: 'string' }, description: 'Languages the CV says they speak. English included only if the CV names it.' },
    current_employer: { type: ['string', 'null'], description: 'Where they work now, if the CV makes it clear. Not a previous employer.' },
    hotel_brands: { type: 'array', items: { type: 'string' }, description: 'Hotel groups and properties they have worked for.' },
    location: { type: ['string', 'null'], description: 'Town or city, if the CV gives one. Never inferred from an employer name.' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'What this CV does not tell us that the profile needs.' },
  },
} as const

const SYSTEM = `You are reading a spa or wellness professional's CV so that somebody at Talent House Collective can check your work and fill in their profile.

Rules, in order of importance:

1. Take nothing from anywhere but the CV. If a product house, system or qualification is not named in it, it is not in your answer. An invented qualification on somebody's professional profile is the worst thing you can produce here, and it is worse than an empty field.

2. Use the given vocabulary. Product houses, systems, qualifications and role level must be chosen from the lists provided. If the CV names something outside the list, leave it out and say so in gaps.

3. Prefer nothing to a guess. Every field may be null or empty, and a human is reading this and filling in what you leave. The bio is the one exception.

4. Always write the bio when the CV holds any career history at all. Summarising what somebody has written about themselves is not a guess, and an empty bio is the most expensive field on a profile to leave blank: it is the first thing a property reads and the last thing anybody gets round to writing.

Write it in the FIRST PERSON, as the professional introducing herself. This has to read exactly as though she wrote it, because a profile that reads like a recruiter's write-up tells everybody it was filled in by somebody else. "I have spent twelve years in five-star resort spas", not "She has spent twelve years". No "Talent House", no third party, no summary of a document: her voice, plainly, sixty to a hundred words, British English, drawn only from the CV and claiming nothing it does not support. If the CV is genuinely too thin to summarise, say so in gaps rather than returning nothing without explanation.

5. role_level must be Unknown unless the CV makes the level plain. A therapist who once covered a manager's holiday is not a Spa Manager.

6. location is a town or city the CV actually gives. Never infer one from an employer's name.

7. British English throughout, and no em dashes.

8. gaps is where you are useful about what is missing: no qualifications listed, no systems named, dates unclear, no current role. Say it plainly so somebody knows what to ask for.`

type Source =
  | { kind: 'pdf'; base64: string }
  | { kind: 'text'; text: string }

/**
 * Read a CV. Returns the reading, or an honest reason it could not be done.
 *
 * Never throws: the caller is an administrator looking at a queue, and a
 * stack trace is not an answer to "why is this button not working".
 */
export async function readCv(source: Source): Promise<
  { ok: true; reading: CvReading } | { ok: false; error: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'Reading CVs is not switched on: ANTHROPIC_API_KEY is not set on this deployment.' }
  }
  if (source.kind === 'text' && source.text.trim().length < 40) {
    return { ok: false, error: 'There is not enough text there to read. Paste the CV, or attach it as a PDF.' }
  }

  // No retries, because the ceiling is the ceiling.
  //
  // The SDK retries twice by default. With a twenty second timeout on each
  // attempt that is sixty seconds of trying inside a function the host kills
  // at twenty-six, so a slow first attempt guaranteed the whole route died
  // and the screen said "the server gave up" rather than anything useful.
  // One attempt, inside the budget, with an honest answer either way.
  const client = new Anthropic({ apiKey, maxRetries: 0 })

  const content: Anthropic.ContentBlockParam[] = source.kind === 'pdf'
    ? [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: source.base64 } },
        { type: 'text', text: 'Read this CV and fill in the profile.' },
      ]
    : [{ type: 'text', text: `Read this CV and fill in the profile.\n\n---\n${source.text.slice(0, MAX_CV_CHARS)}` }]

  try {
    const response = await client.messages.create({
      model: CV_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM,
      // Thinking off, deliberately.
      //
      // On this model omitting the parameter does not mean no thinking: it
      // runs adaptive, which is the default and was never chosen. Every call
      // on this platform was paying for a reasoning phase before it produced
      // a token, which is most of why they kept dying at the twenty-six
      // second ceiling and reporting it as "that took too long".
      //
      // This is extraction against a fixed schema rather than a problem to
      // work out. There is nothing here to think about.
      thinking: { type: 'disabled' },
      // A CV is a short document read against a fixed vocabulary. It does not
      // need the model's full deliberation, and the difference is somebody's
      // money on a platform earning none yet.
      output_config: {
        // Low, because this is extraction against a fixed list rather than a
        // judgement, and because the whole request has to finish inside a
        // serverless timeout. A better answer that arrives after the function
        // is killed is not a better answer.
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA as any },
      },
      messages: [{ role: 'user', content }],
    }, { timeout: CALL_TIMEOUT_MS })

    if (response.stop_reason === 'refusal') {
      return { ok: false, error: 'The reader declined to process that document. Fill the profile in by hand.' }
    }

    const text = response.content.find(block => block.type === 'text')
    if (!text || text.type !== 'text') {
      return { ok: false, error: 'The reader returned nothing usable. Try again, or fill it in by hand.' }
    }

    return { ok: true, reading: normalise(JSON.parse(text.text)) }
  } catch (error: any) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'The Anthropic API key on this deployment was refused. Check it in Netlify.' }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: 'Too many CVs at once. Wait a minute and try again.' }
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return {
        ok: false,
        error: 'That CV took too long to read. Paste the text into the box below instead, or try a shorter document.',
      }
    }
    return { ok: false, error: error?.message || 'The CV could not be read.' }
  }
}

/**
 * Trust nothing that comes back.
 *
 * Structured outputs constrain the shape, and the shape is not the risk. The
 * risk is a value outside our vocabulary reaching a profile, where it matches
 * nothing and quietly makes somebody unfindable. So every list is filtered
 * against the taxonomy again on the way in.
 */
function normalise(raw: any): CvReading {
  const pick = (values: unknown, allowed: readonly string[]) =>
    Array.isArray(values)
      ? Array.from(new Set(values.map(String).filter(value => allowed.includes(value))))
      : []
  const free = (values: unknown, limit: number) =>
    Array.isArray(values)
      ? Array.from(new Set(values.map(value => String(value).trim().slice(0, 80)).filter(Boolean))).slice(0, limit)
      : []
  const line = (value: unknown, limit: number) => {
    const text = typeof value === 'string' ? value.trim() : ''
    return text ? text.slice(0, limit) : null
  }

  const years = Number(raw?.experience_years)

  return {
    full_name: line(raw?.full_name, 200),
    headline: line(raw?.headline, 120),
    // Unknown is the sentinel the schema needs, and null is what a profile
    // wants. Anything outside the vocabulary is also null: a level the
    // platform does not recognise matches nothing and would quietly make
    // somebody unfindable rather than visibly wrong.
    role_level: ROLE_LEVELS.includes(raw?.role_level) ? raw.role_level : null,
    // Nobody has sixty years in this industry, and a stray 2015 read as a
    // duration would put somebody at the top of every experience filter.
    experience_years: Number.isFinite(years) && years >= 0 && years <= 60 ? Math.round(years) : null,
    bio: line(raw?.bio, 2000),
    product_houses: pick(raw?.product_houses, PRODUCT_HOUSES),
    systems_experience: pick(raw?.systems_experience, SYSTEMS),
    qualifications: pick(raw?.qualifications, QUALIFICATIONS),
    treatment_skills: free(raw?.treatment_skills, 40),
    business_skills: free(raw?.business_skills, 20),
    languages: free(raw?.languages, 12),
    current_employer: line(raw?.current_employer, 160),
    hotel_brands: free(raw?.hotel_brands, 20),
    location: line(raw?.location, 120),
    gaps: free(raw?.gaps, 12),
  }
}
