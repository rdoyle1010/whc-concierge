import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { planCollection } from '../src/lib/documents/collect-plan'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const row = (id: string, over: Record<string, any> = {}) => ({
  id,
  reference: `SPA-TREAT-SOP-00${id}`,
  title: `Document ${id}`,
  department: 'Spa',
  version: '0.1',
  kind: 'sop',
  status: 'draft',
  document: {},
  ...over,
})

const drafted = (id: string) => ({ id, draft: { purpose: 'Because it matters.' }, error: null })

test('a drafted document is planned as a whole row, ready to save in bulk', () => {
  const targets = new Map([['a', row('a')]])
  const plan = planCollection([drafted('a')], targets, '2026-09-14T00:00:00.000Z')

  assert.equal(plan.writes.length, 1)
  assert.equal(plan.failed, 0)
  assert.equal(plan.skipped, 0)
  // The whole row, not a patch: the caller saves these with one upsert per
  // fifty rather than one update per document, which is the only reason a
  // batch of three hundred and thirty-eight fits inside the host's ceiling.
  assert.equal(plan.writes[0].id, 'a')
  assert.equal(plan.writes[0].reference, 'SPA-TREAT-SOP-00a')
  assert.equal(plan.writes[0].status, 'draft')
  assert.equal(plan.writes[0].updated_at, '2026-09-14T00:00:00.000Z')
  assert.equal((plan.writes[0].document as any).purpose, 'Because it matters.')
})

test('nothing already written, signed off, or gone is overwritten', () => {
  const targets = new Map([
    ['written', row('written', { document: { purpose: 'A person wrote this.' } })],
    ['approved', row('approved', { status: 'approved' })],
  ])
  const plan = planCollection(
    [drafted('written'), drafted('approved'), drafted('vanished')],
    targets,
    '2026-09-14T00:00:00.000Z',
  )

  assert.equal(plan.writes.length, 0, 'none of these are ours to overwrite')
  assert.equal(plan.skipped, 3)
  assert.equal(plan.failed, 0)
})

test('a repeat batch reports nothing new rather than nothing at all', () => {
  // Five batches of the same tier were submitted and paid for. Four can only
  // ever find documents that are already written, and reporting that as
  // "nothing came back" sends her looking for a fault that is not there.
  const targets = new Map([['a', row('a', { document: { purpose: 'Already here.' } })]])
  const plan = planCollection([drafted('a')], targets, '2026-09-14T00:00:00.000Z')
  assert.equal(plan.writes.length, 0)
  assert.equal(plan.skipped, 1)
})

test('a refusal keeps the provider words, and only the first few', () => {
  const results = [
    { id: 'a', draft: null, error: 'errored: overloaded' },
    { id: 'b', draft: null, error: 'errored: overloaded' },
    { id: 'c', draft: null, error: 'expired: the batch ran out of time' },
    { id: 'd', draft: null, error: 'refusal' },
    { id: 'e', draft: null, error: 'something else again' },
  ]
  const plan = planCollection(results, new Map(), '2026-09-14T00:00:00.000Z')
  assert.equal(plan.failed, 5)
  assert.equal(plan.refused.length, 3, 'three distinct reasons is enough to act on')
  assert.equal(plan.refused[0], 'errored: overloaded')
  assert.ok(plan.refused.includes('expired: the batch ran out of time'))
})

test('collection stops on the clock and says it has not finished', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const collect = route.slice(route.indexOf("if (action === 'collect')"), route.indexOf("if (action === 'adopt_batch')"))
  assert.ok(collect.length > 1000, 'the collect handler should have been found')

  // The host stops a function at twenty-six seconds. A collection that runs
  // past it is killed with no receipt written, which is how a paid batch
  // becomes unreachable, so it must stop itself first.
  assert.match(collect, /DEADLINE_MS = 20_?000/)
  assert.match(collect, /outOfTime\(\)/)
  assert.match(collect, /unfinished \+= 1/)

  // Bulk, not one document at a time.
  assert.match(collect, /\.upsert\(slice\)/)
  assert.ok(!/\.eq\('id', result\.id\)/.test(collect), 'no per-document update inside the loop')

  // A partial collection must reach the screen as partial.
  assert.match(collect, /unfinished: unfinished \|\| undefined/)
  const page = body('src/app/admin/documents/page.tsx')
  assert.match(page, /body\?\.unfinished/)
  assert.match(page, /Press Collect what is ready again/)
})
