import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('stock is counted against the catalogue, not against the table', () => {
  const source = body('src/components/StandardsCatalogue.tsx')

  // The shop read "483 of 477 ready to send today". The numerator was every
  // signed-off row in the database and the denominator was only what is for
  // sale, so anything written outside the catalogue pushed the count past its
  // own total. A buyer reads that as a shop that does not know what it has.
  assert.ok(source.includes('catalogueReferences'))
  assert.ok(source.includes('catalogueReferences.has(reference)'))
  assert.ok(!/const readyTotal = available\?\.length/.test(source),
    'the total must not be the raw row count')

  // And a department counts what its own pack contains rather than anything
  // carrying a matching department label.
  assert.ok(source.includes('readyIn(pack)'))
  assert.ok(source.includes('pack.includes(reference)'))
})

test('signing off in bulk refuses everything an approval would be a lie about', () => {
  const source = body('src/app/api/admin/documents/route.ts')
  const start = source.indexOf("if (action === 'approve_ready')")
  assert.ok(start > 0, 'the bulk sign-off exists')
  const block = source.slice(start, start + 4200)

  // The same four bars as the single approval, because a rule that only the
  // slow path enforces is not a rule.
  assert.ok(block.includes('isValidReference(draft.reference)'))
  assert.ok(block.includes('Object.keys(draft.document).length'))
  assert.ok(block.includes('missingFor(draft.kind, draft.document).length'))

  // Life safety stays one at a time. Approving one states that a competent
  // person checked it against the actual premises, and no single press covers
  // forty fire and pool procedures.
  assert.ok(block.includes('isLifeSafety(draft)'))
  assert.ok(block.includes('lifeSafety += 1'))

  // Only drafts. Retired documents must not be quietly resurrected by a
  // button whose name says nothing about them.
  assert.ok(block.includes("eq('status', 'draft')"))

  // And it reports what it refused, by count and by reason. A number that
  // only counts successes is how nine empty documents came to be signed off.
  assert.ok(block.includes('Held back'))
})

test('a bulk sign-off that stops half way says how far it got', () => {
  const source = body('src/app/api/admin/documents/route.ts')
  const start = source.indexOf("if (action === 'approve_ready')")
  const block = source.slice(start, start + 4200)

  // Four hundred documents cannot be one update, and a function the host
  // kills at twenty-six seconds cannot be four hundred. So it goes in chunks,
  // and a chunk that fails reports the ones that landed rather than a bare
  // error over a library that is now half signed off.
  assert.ok(/at \+= 100/.test(block))
  assert.ok(block.includes('were signed off before it stopped'))

  // The approval is recorded against the version it applied to, so the
  // updates are grouped by version rather than stamped with one.
  assert.ok(block.includes('byVersion'))
  assert.ok(block.includes('approved_version: version'))
})
