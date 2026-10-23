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
  assert.ok(page.includes('unfinished'))
  assert.ok(page.includes('window.confirm'))
})

test('the button counts what it will actually send, not what is unfinished', () => {
  const page = body('src/app/admin/documents/page.tsx')

  // It offered to write thirteen again and sent six, because it counted every
  // unfinished document and the action only takes the ones it can honestly
  // redraft: unapproved procedures. A button that reports its intention
  // rather than its outcome is the thing this screen keeps getting wrong.
  assert.ok(page.includes("row.kind === 'sop' && row.status !== 'approved'"),
    'the count is the same filter the route applies')
  assert.ok(page.includes('redraftable.length > 0'), 'and it is hidden when there are none')
  assert.ok(!/rows\.filter\(r => r\.written && r\.missing\.length > 0\)\.length\} unfinished/.test(page),
    'the old count is gone')
})

test('a document signed off and still unfinished is called out, not counted', () => {
  const page = body('src/app/admin/documents/page.tsx')

  // An approval says somebody read a finished document, so this state should
  // not exist. It is the only thing on that screen that is actually wrong
  // rather than merely unfinished, and folding it into a number hides it.
  assert.ok(page.includes('signedUnfinished'))
  assert.ok(page.includes('signed off and still missing something'))
  assert.ok(page.includes("setOnly('signed-unfinished')"), 'and she can see which ones')
  assert.ok(page.includes("only === 'signed-unfinished'"))

  // The ones no redraft can fix are named separately, or the two counts read
  // as the same problem reported twice.
  assert.ok(page.includes('unfinishedPlans'))
  assert.ok(page.includes('would not help'))
})

test('and it can be repaired in one press, without being signed off again', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const repair = route.slice(route.indexOf("action === 'repair_signed_unfinished'"),
    route.indexOf("action === 'approve_ready'"))
  assert.ok(repair.length > 500, 'the repair action should have been found')

  // It looks at what is signed off and asks the same completeness question
  // the screen asks, so the two can never disagree about which are broken.
  assert.match(repair, /\.eq\('status', 'approved'\)/)
  assert.match(repair, /missingFor\(row\.kind, row\.document\)/)

  // The sign-off comes back on every one of them. That is the fact which is
  // certainly wrong, whether or not the content can be rebuilt here.
  assert.match(repair, /approved_by: null/)
  assert.match(repair, /approved_at: null/)
  assert.match(repair, /approved_version: null/)
  assert.match(repair, /status: 'draft'/)

  // And nothing is approved by it. Seven documents carrying a signature over
  // an unfinished procedure is not fixed by a machine signing them again.
  assert.doesNotMatch(repair, /status: 'approved'/, 'a repair never signs anything off')
  assert.doesNotMatch(repair, /approved_by: actor/)

  // A rebuild that is still short is not written. Replacing one unfinished
  // document with another and calling it repaired is how this started.
  assert.match(repair, /missingFor\(row\.kind, document\)\.length === 0/)
  assert.match(repair, /stillShort/)

  // Chunked, because the host kills the function at twenty-six seconds and a
  // half-finished repair is worse than none.
  assert.match(repair, /at \+= 20/)

  // The whole row goes back, not the columns this action cares about.
  //
  // It read seven columns and upserted what it built from them. Postgres runs
  // an upsert as an insert that falls back to an update, so the insert has to
  // satisfy every not-null constraint on the table first, and it failed on
  // reference before it ever reached the conflict. Nothing was written, which
  // is the one good thing about a constraint, but the repair did nothing and
  // said so in a wall of Postgres.
  assert.match(repair, /\.select\('\*'\)/, 'a partial row cannot be upserted')
  assert.match(repair, /const cleared = \{\s*\.\.\.row,/, 'the write carries the row it came from')

  const page = body('src/app/admin/documents/page.tsx')
  assert.ok(page.includes("act('repair_signed_unfinished')"))
  assert.ok(page.includes('Nothing is signed off again by this'), 'the confirmation says what it will not do')
})

test('neither way of signing off will accept an unfinished document', () => {
  // Both of these refused already. Pinned because the seven that got through
  // were signed before the completeness rule was tightened, which means the
  // rule is the thing protecting them and a change to it is a change to this.
  const route = body('src/app/api/admin/documents/route.ts')

  const single = route.slice(route.indexOf("if (action === 'approve')"),
    route.indexOf("if (action === 'unapprove'"))
  assert.match(single, /const missing = missingFor\(row\.kind, row\.document\)/)
  assert.match(single, /if \(missing\.length\)/)
  assert.ok(single.indexOf('missingFor') < single.indexOf("status: 'approved'"),
    'the check has to come before the write')

  const bulk = route.slice(route.indexOf("if (action === 'approve_ready')"))
  assert.match(bulk, /if \(missingFor\(draft\.kind, draft\.document\)\.length\) \{ incomplete \+= 1; continue \}/)
})

test('every bulk write to the library carries a whole row', () => {
  // The repair built {id, status, approved_by: null, ...} and upserted it,
  // which Postgres runs as an insert first. One not-null column away from
  // working, and the failure arrives as a constraint name in a red box.
  //
  // So: anything pushed into a list that is later upserted either spreads the
  // row it came from or states every required column itself.
  const route = readFileSync('src/app/api/admin/documents/route.ts', 'utf8')
  // A window after each push rather than a balanced match, because the shapes
  // differ and a regex that only matches one of them is a check that passes
  // by matching nothing.
  const pushes: string[] = []
  for (let at = route.indexOf('writes.push({'); at >= 0; at = route.indexOf('writes.push({', at + 1)) {
    pushes.push(route.slice(at, at + 260))
  }
  assert.ok(pushes.length >= 3, `only found ${pushes.length} bulk writes, the check has stopped matching`)
  for (const shape of pushes) {
    const spreads = /\.\.\.(target|row|cleared|existing)/.test(shape)
    const states = /reference:/.test(shape)
    assert.ok(spreads || states,
      `a bulk write carries neither a spread row nor a reference:\n${shape.trim().slice(0, 200)}`)
  }
})
