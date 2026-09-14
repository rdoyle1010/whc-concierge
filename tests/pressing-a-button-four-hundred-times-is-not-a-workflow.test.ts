import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const batch = body('src/lib/documents/batch.ts')
const draft = body('src/lib/documents/draft.ts')
const route = body('src/app/api/admin/documents/route.ts')
const page = body('src/app/admin/documents/page.tsx')
const reader = body('src/lib/cv-read.ts')
const writer = body('src/lib/ai-write.ts')

// Omitting the thinking parameter on this model does not mean no thinking. It
// runs adaptive, which is the default and was never chosen, so every call on
// this platform was paying for a reasoning phase before producing a token.
// That is most of why they kept dying at the twenty-six second ceiling and
// reporting it as "that took too long".
test('nothing pays for thinking it never asked for', () => {
  for (const [name, source] of [['the CV reader', reader], ['the writing assistant', writer], ['the drafter', draft], ['the batch', batch]] as const) {
    assert.match(source, /thinking: \{ type: 'disabled'( as const)? \}/, `${name} still runs adaptive thinking by default`)
  }
})

// Four hundred and sixty clicks at fifteen seconds apiece is an afternoon of
// somebody watching a spinner to find out whether a spa platform can write.
test('a whole tier is written in one submission', () => {
  assert.match(route, /action === 'draft_tier'/)
  assert.match(batch, /client\.messages\.batches\.create/)
  assert.match(page, /Write this whole tier/)
  assert.match(page, /Collect what is ready/)

  // Only the empty ones. Redrafting over something written throws away
  // whatever a person corrected in it.
  const submit = route.slice(route.indexOf("action === 'draft_tier'"), route.indexOf("action === 'collect'"))
  assert.match(submit, /Object\.keys\(row\.document \|\| \{\}\)\.length === 0/)
  assert.match(submit, /\.eq\('status', 'draft'\)/)
})

// Results come back in any order, so the id is the only thing joining a
// result to the document it belongs to.
test('a result is matched back by id, never by position', () => {
  assert.match(batch, /custom_id: item\.id/)
  assert.match(batch, /const id = entry\.custom_id/)
  assert.doesNotMatch(batch, /results\[index\]|\.map\(\(result, index\)/)
})

// A batch takes minutes to hours, which is longer than any request asking
// about it. The honest answer while it runs is that it is still running.
test('collecting is honest about a batch that has not finished', () => {
  assert.match(batch, /batch\.processing_status !== 'ended'/)
  assert.match(batch, /ready: false/)
  assert.match(page, /Still being written\./)
})

// Somebody may have written or signed one off while the batch was running.
test('a batch never overwrites what a person has done since', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("action === 'draft'"))
  assert.match(collect, /target\.status === 'approved'/)
  assert.match(collect, /Object\.keys\(target\.document \|\| \{\}\)\.length > 0/)
  assert.match(collect, /status: 'draft'/)
  assert.doesNotMatch(collect, /status: 'approved'/)
})

// A receipt that never saved leaves a finished batch marked as still running,
// which means collecting it again forever.
test('every write is checked, including the bookkeeping', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("action === 'draft'"))
  assert.match(collect, /const \{ error: noteError \}/)
  assert.match(collect, /const \{ error: receiptError \}/)
  assert.match(collect, /still marked as running/)

  // The submission says so too, rather than reporting a failure that would
  // have her send four hundred documents a second time.
  const submit = route.slice(route.indexOf("action === 'draft_tier'"), route.indexOf("action === 'collect'"))
  assert.match(submit, /the receipt did not save/)
  assert.match(submit, /The batch id is/)
})

// A batch of four hundred and sixty and one press of a button must ask for
// exactly the same thing, or the library is written in two voices.
test('both paths draft from one brief and assemble one shape', () => {
  assert.match(draft, /export function draftPrompt/)
  assert.match(batch, /draftPrompt\(item\)/)
  assert.match(draft, /messages: \[\{ role: 'user', content: draftPrompt\(input\) \}\]/)
  assert.match(batch, /DRAFT_SYSTEM/)
  assert.match(batch, /DRAFT_SCHEMA/)
  assert.match(route, /documentFromDraft\(target, result\.draft\)/)
  assert.match(route, /documentFromDraft\(row, result\.draft\)/)
})
