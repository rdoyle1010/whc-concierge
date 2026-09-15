import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  WRITE_FIELDS, WRITE_MODEL, isWriteField, writeFieldLabel, buildWriteRequest,
} from '../src/lib/ai-write'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The rules the writer actually sends: the shared house style, which every AI
// surface on the platform now prepends, plus what the profile writer adds on
// top of it. They were one file until the same rules had to reach five routes
// across two AI providers.
const lib = body('src/lib/ai-write.ts') + body('src/lib/house-style.ts')
const route = body('src/app/api/ai/write/route.ts')
const widget = body('src/components/AiWrite.tsx')
const talent = read('src/app/talent/profile/page.tsx')
const employer = read('src/app/employer/profile/page.tsx')
const factFile = read('src/app/employer/property-fact-file/page.tsx')
const practice = read('src/app/talent/consultancy/page.tsx')

// The same problem on every account type: a person who can do the job cannot
// face writing a paragraph about doing the job, so the field stays empty and
// the profile reads as abandoned.
test('the blank box is answered wherever it appears', () => {
  for (const field of ['talent_bio', 'talent_headline', 'employer_about', 'employer_tagline', 'job_description']) {
    assert.ok(WRITE_FIELDS.includes(field as any), `${field} has no writing help`)
    assert.ok(writeFieldLabel(field as any).length > 0)
  }
  assert.ok(!isWriteField('anything_else'))

  assert.match(talent, /field="talent_bio"/)
  assert.match(talent, /field="talent_headline"/)
  assert.match(talent, /field="talent_commercial"/)
  assert.match(employer, /field="employer_about"/)
  assert.match(employer, /field="employer_tagline"/)
})

// Every long box in the Property Fact File, and every free-text box in a
// consultancy listing. These are the ones somebody stares at for a minute and
// then leaves, and a listing with an empty "what changed" is a listing that
// argues for nothing.
test('the boxes further in are covered too', () => {
  for (const field of ['talent_commercial', 'property_policy', 'practice_headline', 'practice_about', 'practice_work', 'practice_outcome']) {
    assert.ok(WRITE_FIELDS.includes(field as any), `${field} has no writing help`)
  }

  // One shape for twelve boxes, told which one it is. Twelve entries would
  // have drifted apart within a month.
  assert.match(factFile, /field="property_policy"/)
  assert.match(factFile, /subject=\{label\}/)
  assert.match(factFile, /LONG_FIELDS\.has\(key\) \? \(\s*<>/, 'it sits with every long box, not one of them')

  assert.match(practice, /field="practice_headline"/)
  assert.match(practice, /field="practice_about"/)
  assert.match(practice, /field="practice_work"/)
  assert.match(practice, /field="practice_outcome"/)
})

// A hotel buys judgement on evidence, so the outcome line is the one place a
// invented number would do real damage.
test('a number is a fact, and an absent one is not invented', () => {
  assert.match(lib, /A number is a fact and survives exactly as it is/)
  assert.match(lib, /never round one, never add a percentage sign/)
  assert.match(lib, /never write "significant" or "substantial" where a number was expected/)
  // And the rule that stops a rewrite quietly deleting an award, which is
  // the commonest way this makes a profile worse.
  assert.match(lib, /What must survive, always:/)
})

// A route that writes a biography from whatever JSON it is handed will
// cheerfully write somebody else's, and the only thing stopping it would be
// that nobody had tried.
test('it writes from their own record, not from the request', () => {
  assert.match(route, /const user = await getRequestUser\(req\)/)
  assert.match(route, /eq\('user_id', userId\)/)
  const gather = route.slice(route.indexOf('async function gatherFacts'))
  // The one exception is a role that does not exist yet, and even then the
  // property it belongs to is read from the database.
  assert.match(gather, /from\('employer_profiles'\)[\s\S]{0,400}eq\('user_id', userId\)/)
  assert.ok(!/body\.(full_name|bio|about_text|property_name)/.test(gather),
    'identity must never come from the body')
})

// Nothing is decided here and nothing is saved here. It is doing the typing.
test('a draft is offered, never applied', () => {
  assert.match(widget, /onAccept\(draft\)/)
  assert.match(widget, /Nothing is saved until you say so/)
  assert.match(widget, /Leave mine as it is/)
  assert.doesNotMatch(route, /\.update\(|\.upsert\(/, 'the writing route writes no profile field')
  // Except the consent record, which is an insert into its own ledger.
  assert.match(route, /consent_events/)
})

// Somebody who does not like a draft says why in one line and presses again.
// That is how a person works with a draft, and a button that can only try the
// same thing again is a button pressed once.
test('a draft can be argued with', () => {
  assert.match(widget, /placeholder="Shorter\./)
  assert.match(route, /steer = typeof body\.steer === 'string'/)
  assert.match(lib, /What they have asked for: \$\{steer\}/)
})

// The house style is enforced rather than requested. A model asked nicely not
// to use an em dash will use one eventually, and this platform fails its own
// readiness check over a single one.
test('the house style is not left to good manners', () => {
  assert.match(lib, /British English/)
  assert.match(lib, /Never invent an employer, a qualification, a treatment, a brand, a date, a number or an award/)
  assert.match(lib, /\\u2014/, 'the em dash is stripped from the answer, not just discouraged')
  assert.match(lib, /passionate, dynamic, vibrant/)
})

// A better paragraph that arrives after the function has been killed is not a
// better paragraph.
test('every writing route fits inside the ceiling the host enforces', () => {
  // One model constant for the whole platform, named rather than defaulted: a
  // default silently becomes whatever the SDK ships next.
  assert.match(WRITE_MODEL, /^claude-[a-z0-9-]+$/)
  for (const file of [
    'src/app/api/ai/write/route.ts',
    'src/app/api/employer/jobs/ai/route.ts',
    'src/app/api/applications/ai/route.ts',
    'src/app/api/employer/applications/communication-ai/route.ts',
    'src/app/api/employer/applications/message-ai/route.ts',
  ]) {
    const source = body(file)
    const declared = Number(source.match(/maxDuration = (\d+)/)?.[1])
    assert.ok(declared > 0 && declared <= 26, `${file} declares ${declared}, which the host will not honour`)
  }
  // And the model is cut off before the function is, so a failure can be
  // written into a sentence instead of an error page. That timeout used to be
  // repeated in each route beside its own hand-written fetch call; it lives in
  // the one client now, which is the point of there being one.
  const client = body('src/lib/ai.ts')
  const timeout = Number(client.match(/const TIMEOUT_MS = (\d+)/)?.[1])
  assert.ok(timeout > 0 && timeout < 26000, `the client waits ${timeout}ms inside a 26 second ceiling`)
  assert.match(client, /timeout: TIMEOUT_MS/)
})

// One account, one allowance. A shared office address should not stop the
// second person of the day from writing their own profile.
test('the limit is per account', () => {
  assert.match(route, /key: user\.id/)
})

// The prompt is built where it can be read, not only where it is sent.
//
// It used to be assembled inline inside the function that calls Anthropic, so
// the only way to know what this platform actually asks for was to call it.
// Pulled out, it can be asserted here, and it can be handed to a second
// provider by scripts/compare-writers.ts: a comparison where each side gets a
// slightly different prompt measures the prompts rather than the providers.
test('the prompt carries the house style, the shape and the facts', () => {
  const built = buildWriteRequest({
    field: 'practice_headline',
    mode: 'write',
    draft: 'Award-winning spa consultancy',
    facts: { Practice: 'Wellness House Collective', 'Based in': 'Yorkshire' },
  })
  assert.ok(built.ok)
  if (!built.ok) return
  assert.match(built.system, /What must survive, always:/, 'the rules travel with it')
  assert.match(built.prompt, /Wellness House Collective/, 'and the facts it was given')
  assert.match(built.prompt, /Based in: Yorkshire/)
  // Writing a fresh one still mines the existing text for what was earned.
  assert.match(built.prompt, /It is not prose to preserve, it is a source of facts/)
  assert.match(built.prompt, /Award-winning spa consultancy/)
  assert.ok(built.maxTokens > 0)
})

test('an empty box with no facts is refused before anything is spent', () => {
  const built = buildWriteRequest({ field: 'talent_bio', mode: 'write', facts: {} })
  assert.ok(!built.ok)
  if (built.ok) return
  assert.match(built.error, /Fill in a few of the fields above first/)
})

// The consolidation onto one provider was argued on the code: one SDK, one
// key, one bill. It was not argued on quality, and the assistant recommending
// it is made by one of the two vendors. This is how that gets settled.
test('the comparison harness is blind and does not spend without being told to', () => {
  const harness = readFileSync('scripts/compare-writers.ts', 'utf8')
  assert.match(harness, /buildWriteRequest/, 'both sides get the prompt the platform really sends')
  assert.match(harness, /Math\.random\(\) < 0\.5/, 'which writer is A is a coin toss per item')
  assert.match(harness, /--confirm/, 'it prices the run and waits')
  assert.match(harness, /key\.md/, 'and the answer key is a separate file')
  // It reintroduces the other provider on purpose, in a script, never in a
  // route. Readiness checks 45 and 46 scan src and would fail otherwise.
  assert.ok(!harness.includes('src/app/'), 'nothing here is wired into the site')
})
