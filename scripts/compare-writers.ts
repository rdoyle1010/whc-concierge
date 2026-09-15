import { writeFileSync, mkdirSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import { buildWriteRequest, type WriteField, type WriteRequest } from '../src/lib/ai-write'

// Which provider actually writes better, decided by reading rather than by
// taking somebody's word for it.
//
// This platform ran on two AI providers and was consolidated onto one. The
// consolidation was argued on things anybody can check in the code: one SDK
// instead of six hand-written fetch calls, one key, one bill, three hundred
// fewer lines. It was NOT argued on quality, because quality cannot be
// asserted from a codebase, and the assistant making the recommendation is
// made by one of the two vendors. This is how that gets settled honestly.
//
// Three things make it a fair test rather than a demonstration.
//
// Both sides get the identical prompt. buildWriteRequest is the same function
// the live route calls, so what is being compared is the platform's own house
// style on the platform's own fields, not a prompt written for the occasion. A
// comparison where each side gets a slightly different prompt measures the
// prompts.
//
// It is blind. Each item labels the two answers Writer A and Writer B in a
// random order, and which is which is written to a separate file you should
// not open until you have marked the sheet. Reading the answers knowing the
// brands is not a test, it is a confirmation of what you already expected.
//
// It uses the shapes people actually leave empty: a therapist's bio, a spa
// director's headline, a consultant's practice, a property description, a job
// advert. The boxes that decide whether a profile gets read.
//
// It costs real money to run, in both accounts. Six profiles, two providers,
// short outputs: pennies rather than pounds, but it is spend, so it prints an
// estimate and waits for --confirm before it calls anything.
//
// Usage:
//   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... \
//     npx tsx scripts/compare-writers.ts --confirm

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'
const OPENAI_MODEL = process.env.OPENAI_COMPARE_MODEL || 'gpt-5-mini'
const OUT_DIR = process.env.COMPARE_OUT || './comparison'

// Six fields somebody actually leaves empty, with facts of the shape the
// server really gathers. Invented people, because a comparison published to a
// repository must not carry a real member's profile, and the point is the
// shape of the input rather than whose it is.
const CASES: { name: string; request: WriteRequest }[] = [
  {
    name: 'A therapist who has never written about herself',
    request: {
      field: 'talent_bio' as WriteField, mode: 'write', facts: {
        'Role level': 'Senior Therapist',
        'Years in the industry': 11,
        'Treatments and services': ['Deep tissue', 'Hot stone', 'Prenatal massage', 'Facials', 'Body wraps'],
        'Qualifications': ['NVQ Level 3 Beauty Therapy', 'CIBTAC', 'Level 4 Advanced Facial'],
        'Product houses trained with': ['ESPA', 'Elemis', 'Carol Joy London'],
        'Hotel brands worked with': ['Rockliffe Hall', 'Gleneagles'],
        'Where they are': 'North Yorkshire',
        'Largest team managed': 4,
      },
    },
  },
  {
    name: 'A spa director rewriting a headline that is already good',
    request: {
      field: 'talent_headline' as WriteField, mode: 'improve',
      draft: 'Award-winning Spa Director with 18 years in five-star resort spas, opened three properties',
      facts: {
        'Role level': 'Spa Director',
        'Years in the industry': 18,
        'Business and management skills': ['P&L ownership', 'Pre-opening', 'Recruitment', 'Retail strategy'],
        'Hotel brands worked with': ['Six Senses', 'Rosewood'],
        'Revenue responsibility': '2.4m',
      },
    },
  },
  {
    name: 'A consultant, fresh, with an award in the box she is replacing',
    request: {
      field: 'practice_headline' as WriteField, mode: 'write',
      draft: 'Award-winning spa and wellness consultancy transforming concepts, teams and commercial performance',
      facts: {
        'Practice': 'Wellness House Collective',
        'Years in the industry': 35,
        'Based in': 'Yorkshire',
        'Works': 'Worldwide',
        'What they lead on': ['Pre-opening', 'Operations', 'Commercial strategy', 'Treatment menu development'],
        'How they are engaged': ['Retained', 'Project', 'Day rate'],
      },
    },
  },
  {
    name: 'The same consultant, the long box, nothing written',
    request: {
      field: 'practice_about' as WriteField, mode: 'write', facts: {
        'Practice': 'Wellness House Collective',
        'Years in the industry': 35,
        'Based in': 'Yorkshire',
        'What they lead on': ['Pre-opening and mobilisation', 'Operational reviews', 'Revenue strategy', 'Brand partnerships'],
        'How they are engaged': ['Retained', 'Project'],
      },
    },
  },
  {
    name: 'A property describing itself',
    request: {
      field: 'employer_about' as WriteField, mode: 'write', facts: {
        'Property': 'a country house hotel and spa',
        'Where': 'the Yorkshire Dales',
        'Rooms': 61,
        'Treatment rooms': 8,
        'Facilities': ['20m pool', 'Hydrotherapy', 'Thermal suite', 'Gym', 'Outdoor sauna'],
        'Product houses': ['ESPA'],
      },
    },
  },
  {
    name: 'A job advert with thin facts, where padding is the temptation',
    request: {
      field: 'job_description' as WriteField, mode: 'write', facts: {
        'Job title': 'Spa Therapist',
        'Property': 'a five-star country house spa',
        'Location': 'North Yorkshire',
        'Contract': 'Full time, permanent',
        'Shift pattern': 'Four days over seven, including weekends',
        'Required qualifications': ['NVQ Level 3 or equivalent'],
      },
    },
  },
]

// Pennies, and worth saying out loud before spending them. Deliberately rough:
// the point is the order of magnitude, so nobody runs this expecting it to be
// free and nobody avoids it expecting it to be expensive.
const ESTIMATE = '£0.05 to £0.20 in total, across both accounts'

async function fromAnthropic(system: string, prompt: string, maxTokens: number): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 1 })
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text).join('').trim()
}

async function fromOpenAi(system: string, prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: 'low' },
      // The same two pieces of text, joined the way this platform used to join
      // them before the consolidation. Neither side gets a prompt written for
      // it.
      input: `${system}\n\n${prompt}`,
      max_output_tokens: maxTokens + 600,
    }),
  })
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${(await response.text().catch(() => '')).slice(0, 300)}`)
  }
  const payload: any = await response.json()
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim()
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text.trim()
    }
  }
  return ''
}

async function main() {
  const missing = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'].filter(name => !process.env[name])
  if (missing.length) {
    console.error(`Both keys are needed to compare two providers. Missing: ${missing.join(', ')}.`)
    console.error('They are in Netlify, not in this repository. Export them into this shell to run it.')
    process.exit(1)
  }

  if (!process.argv.includes('--confirm')) {
    console.log(`This calls ${ANTHROPIC_MODEL} and ${OPENAI_MODEL} ${CASES.length} times each.`)
    console.log(`Estimated cost: ${ESTIMATE}.`)
    console.log('Run it again with --confirm to spend that.')
    process.exit(0)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const sheet: string[] = [
    '# Which one writes better',
    '',
    'Six fields, the same prompt to both, the two answers in a random order.',
    'Mark each one before you look at the key. Three questions per item:',
    '',
    '1. Which one would you put on the site?',
    '2. Did either drop something the person had earned? An award, a brand, a number, a year.',
    '3. Did either invent something that was not in the facts?',
    '',
    '---',
    '',
  ]
  const key: string[] = ['# The key', '', 'Do not read this until the sheet is marked.', '']

  for (const [index, item] of CASES.entries()) {
    const built = buildWriteRequest(item.request)
    if (!built.ok) {
      console.error(`${item.name}: could not build a prompt (${built.error})`)
      continue
    }
    process.stdout.write(`${index + 1}/${CASES.length} ${item.name} ... `)

    // Both at once, so a slow provider does not become a slow script.
    const [anthropicText, openAiText] = await Promise.all([
      fromAnthropic(built.system, built.prompt, built.maxTokens).catch(error => `(failed: ${error.message})`),
      fromOpenAi(built.system, built.prompt, built.maxTokens).catch(error => `(failed: ${error.message})`),
    ])
    console.log('done')

    // The coin toss is what makes it blind. Without it the first column is
    // always the same vendor and the eye learns it by item three.
    const anthropicFirst = Math.random() < 0.5
    const [first, second] = anthropicFirst ? [anthropicText, openAiText] : [openAiText, anthropicText]

    sheet.push(
      `## ${index + 1}. ${item.name}`, '',
      `**The field:** ${item.request.field} · **What they asked for:** ${item.request.mode}`, '',
      ...(item.request.draft ? [`**What was already in the box:**`, '', `> ${item.request.draft}`, ''] : []),
      '### Writer A', '', first || '(nothing came back)', '',
      '### Writer B', '', second || '(nothing came back)', '',
      '**Better:** A / B / neither', '',
      '**Anything earned that went missing:**', '',
      '**Anything invented:**', '',
      '---', '',
    )
    key.push(`${index + 1}. ${item.name}`,
      `   Writer A: ${anthropicFirst ? ANTHROPIC_MODEL : OPENAI_MODEL}`,
      `   Writer B: ${anthropicFirst ? OPENAI_MODEL : ANTHROPIC_MODEL}`, '')
  }

  writeFileSync(`${OUT_DIR}/sheet.md`, sheet.join('\n'))
  writeFileSync(`${OUT_DIR}/key.md`, key.join('\n'))
  console.log(`\nRead ${OUT_DIR}/sheet.md and mark it.`)
  console.log(`Then, and only then, ${OUT_DIR}/key.md says which was which.`)
}

main().catch(error => {
  console.error(error?.message || error)
  process.exit(1)
})
