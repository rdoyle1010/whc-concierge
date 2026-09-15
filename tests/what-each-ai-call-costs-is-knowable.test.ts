import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AI_MODEL, AI_MODEL_READING, modelFor } from '../src/lib/ai'

// A bill arrives as one number for every AI surface on the platform.
//
// The first fortnight's spend was read as a run rate and blamed on the live
// site. It was not: it was one day, one batch, and the document library being
// drafted. The guess was wrong because there was nothing to check it against,
// only code to read and arithmetic to do in your head. These tests hold the
// two things that make the next reading a reading rather than a guess: every
// call says what it is, and the model is chosen by the job rather than once
// for everything.

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('reading a document and writing prose are not paid for at the same rate', () => {
  // Reading a CV is extraction against a fixed shape: long input, short
  // structured output, and nobody ever reads the model's sentences. Writing a
  // bio is the platform's voice on somebody's profile. Paying the same for
  // both was the trade nobody had actually looked at.
  assert.notEqual(AI_MODEL, AI_MODEL_READING,
    'one model for both is the thing this split exists to prevent')
  assert.equal(modelFor('writing'), AI_MODEL)
  assert.equal(modelFor('reading'), AI_MODEL_READING)
})

test('the biggest input on the live site goes to the reading model', () => {
  // A CV is the largest thing a member ever hands the platform, and both
  // Interview Ready routes send one alongside a job advert.
  assert.match(body('src/lib/cv-read.ts'), /CV_MODEL = AI_MODEL_READING/)

  for (const route of ['src/app/api/interview-ready/route.ts', 'src/app/api/mobile/interview-ready/route.ts']) {
    const source = body(route)
    assert.match(source, /askForJson/, `${route} should ask for JSON`)
    assert.doesNotMatch(source, /tier:\s*'writing'/,
      `${route} reads a document, so it must not be moved onto the writing model`)
  }
})

test('every AI call names itself in the spend log', () => {
  // Without this the only way to attribute a cost is to read the code and
  // estimate, which is exactly how the first reading went wrong.
  const client = body('src/lib/ai.ts')
  assert.match(client, /logUsage\(label, model, response\.usage\)/,
    'askForText must log what the call actually used')

  const ROUTES = [
    ['src/app/api/interview-ready/route.ts', 'interview ready'],
    ['src/app/api/mobile/interview-ready/route.ts', 'interview ready (mobile)'],
    ['src/app/api/applications/ai/route.ts', 'application analysis'],
    ['src/app/api/employer/jobs/ai/route.ts', 'job advert'],
    ['src/app/api/employer/applications/message-ai/route.ts', 'employer message'],
    ['src/app/api/employer/applications/communication-ai/route.ts', 'employer communication'],
    ['src/app/api/admin/certificates/assist/route.ts', 'certificate assist'],
  ] as const

  for (const [route, label] of ROUTES) {
    assert.match(body(route), new RegExp(`label: '${label.replace(/[()]/g, '\\$&')}'`),
      `${route} must carry the label ${label}`)
  }

  // The two libraries holding the raw SDK report their own, including which
  // field or file kind it was, because "write" on its own does not tell you
  // whether it was a headline or the long practice box.
  assert.match(body('src/lib/ai-write.ts'), /logUsage\(`write \$\{request\.field\}`/)
  assert.match(body('src/lib/cv-read.ts'), /logUsage\(`cv read \(\$\{source\.kind\}\)`/)
})

test('a route that reports a model reports the one it used', () => {
  // It reported the writing model while calling the reading one, which is the
  // kind of small lie that costs an afternoon later.
  const source = body('src/app/api/applications/ai/route.ts')
  assert.match(source, /model: AI_MODEL_READING/)
  assert.doesNotMatch(source, /model: AI_MODEL,/)
})
