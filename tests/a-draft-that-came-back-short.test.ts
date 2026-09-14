import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { planCollection } from '../src/lib/documents/collect-plan'
import { documentFromDraft } from '../src/lib/documents/assemble'
import { missingFromSop } from '../src/lib/documents/types'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const NOW = '2026-09-14T00:00:00.000Z'

/** A drafted procedure, as the model returns one. */
const draft = (over: Record<string, unknown> = {}) => ({
  purpose: 'To do the thing.',
  scope: 'The whole spa.',
  whyItMatters: 'Because it does.',
  steps: [{ action: 'Do it', standard: 'Done properly' }],
  responsibilities: [{ role: 'Therapist', responsibility: 'Does it' }],
  measuredBy: ['Somebody checks'],
  ...over,
})

const row = (over: Record<string, unknown> = {}) => ({
  id: 'one',
  reference: 'REC-THING-SOP-001',
  title: 'A thing',
  department: 'RECEPTION TEAM',
  version: '0.1',
  status: 'draft',
  document: {},
  ...over,
})

test('an unfinished draft is replaced, and only by a better one', () => {
  // The first draft came back with no steps and was stored as written anyway.
  // That is how a dozen documents ended up unsignable while the register
  // reported nothing left to write.
  //
  // Built the way the real one was built, through documentFromDraft, so the
  // stored document has all its scaffolding and is missing exactly the thing
  // the model failed to produce. A hand-made fixture missing half the header
  // would make any redraft look like an improvement.
  const short = documentFromDraft(row() as any, draft({ steps: [] }) as any)
  assert.deepEqual(missingFromSop(short as any), ['at least one step'])
  const target = row({ document: short })

  const better = planCollection(
    [{ id: 'one', draft: draft() as any, error: null }],
    new Map([['one', target]]),
    NOW,
    { replaceUnfinished: true },
  )
  assert.equal(better.writes.length, 1, 'a complete redraft replaces an unfinished one')
  assert.equal(better.improved, 1)
  assert.equal(better.skipped, 0)

  // And never with something equally short, or worse.
  const worse = planCollection(
    [{ id: 'one', draft: draft({ steps: [], responsibilities: [] }) as any, error: null }],
    new Map([['one', target]]),
    NOW,
    { replaceUnfinished: true },
  )
  assert.equal(worse.writes.length, 0, 'nothing is ever replaced with something worse')
  assert.equal(worse.skipped, 1)

  // And an ordinary collection leaves it alone entirely. That default is the
  // important half: an unfinished document and one somebody started writing
  // by hand look identical from here, so only a run that was deliberately
  // sent to redraft them is allowed to replace one.
  const ordinary = planCollection(
    [{ id: 'one', draft: draft() as any, error: null }],
    new Map([['one', target]]),
    NOW,
  )
  assert.equal(ordinary.writes.length, 0, 'an ordinary collection overwrites nothing written')
  assert.equal(ordinary.skipped, 1)
})

test('a finished document is still never touched', () => {
  // The rule that mattered before still matters: a document somebody has
  // completed is finished by definition, and an approval says a person read
  // that exact version.
  const finished = row({ document: documentFromDraft(row() as any, draft() as any) })
  const over = planCollection(
    [{ id: 'one', draft: draft({ steps: [{ action: 'Other', standard: 'Other' }] }) as any, error: null }],
    new Map([['one', finished]]),
    NOW,
    { replaceUnfinished: true },
  )
  assert.equal(over.writes.length, 0)
  assert.equal(over.skipped, 1)

  const approved = planCollection(
    [{ id: 'one', draft: draft() as any, error: null }],
    new Map([['one', row({
      status: 'approved',
      document: documentFromDraft(row() as any, draft({ steps: [] }) as any),
    })]]),
    NOW,
    { replaceUnfinished: true },
  )
  assert.equal(approved.writes.length, 0, 'a signed-off document is never overwritten')

  // An empty one is written as it always was.
  const empty = planCollection(
    [{ id: 'one', draft: draft() as any, error: null }],
    new Map([['one', row()]]),
    NOW,
  )
  assert.equal(empty.writes.length, 1)
  assert.equal(empty.improved, 0, 'writing an empty document is not an improvement, it is the first draft')
})

test('the unfinished ones can be found and sent again in one press', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const start = route.indexOf("if (action === 'draft_incomplete')")
  assert.ok(start > 0, 'the bulk redraft exists')
  const block = route.slice(start, start + 4000)

  // Written, and still missing something. An empty one belongs to the tier
  // drafting; this is only about the ones that look done and are not.
  assert.ok(block.includes('Object.keys(row.document || {}).length > 0'))
  assert.ok(block.includes('missingFor(row.kind, row.document).length > 0'))

  // Only procedures. Everything else is written in the repository and is
  // complete by construction, so sending a checklist to be rewritten would
  // replace a finished document with a guess.
  assert.ok(block.includes("eq('kind', 'sop')"))
  assert.ok(block.includes("neq('status', 'approved')"))

  // Not twice. A batch in flight has written nothing yet, so every document
  // it is working on still looks eligible.
  assert.ok(block.includes('alreadyRunning'))
  assert.ok(block.includes("in('status', ['submitted', 'collecting'])"))

  // The receipt before the money, like every other batch: a run nobody has
  // the id of has been paid for and cannot be collected.
  const receipt = block.indexOf("from('document_batches').insert")
  const submit = block.indexOf('submitDraftBatch(items)')
  assert.ok(receipt > 0 && submit > receipt, 'the receipt is written before anything is sent')
  assert.ok(block.includes('Collect a batch by id'), 'a lost id is still recoverable by hand')

  // And the collection knows which runs may replace an unfinished document,
  // from the run itself rather than from a guess.
  assert.ok(route.includes("replaceUnfinished: String(run.note || '').startsWith('Redraft')"))

  const page = body('src/app/admin/documents/page.tsx')
  assert.ok(page.includes("act('draft_incomplete')"))
  // It says how many, because a button that spends money should say what for.
  assert.ok(page.includes('unfinished ones again'))
  assert.ok(page.includes('window.confirm'))
})
