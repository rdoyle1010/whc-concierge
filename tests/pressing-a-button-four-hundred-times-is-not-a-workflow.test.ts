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
  assert.ok(submit.length > 200, 'the submit block was not found')
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
  assert.match(page, /Still being written/)

  // And it says how far, because "still being written" for the third time in
  // an hour is indistinguishable from broken.
  assert.match(page, /body\.progress/)
  assert.match(route, /written so far/)

  // A run that finished and produced nothing is a different thing entirely,
  // and it reports the provider's own words rather than a count.
  assert.match(page, /The run finished and wrote nothing/)
  assert.match(batch, /detail\?\.error\?\.message \|\| detail\?\.message/)
  assert.match(route, /refused\.length < 3/)
})

// Somebody may have written or signed one off while the batch was running.
test('a batch never overwrites what a person has done since', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("const id = String"))
  assert.ok(collect.length > 200, 'the collect block was not found')
  assert.match(collect, /target\.status === 'approved'/)
  assert.match(collect, /Object\.keys\(target\.document \|\| \{\}\)\.length > 0/)
  assert.match(collect, /status: 'draft'/)
  assert.doesNotMatch(collect, /status: 'approved'/)
})

// A receipt that never saved leaves a finished batch marked as still running,
// which means collecting it again forever.
test('every write is checked, including the bookkeeping', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("const id = String"))
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

// Writing a tier and collecting a batch are about the library, not about one
// document. They sat underneath the guard that demands a document id, so
// every press of either answered "Missing document", which is a true answer
// to a question nobody asked.
test('the library-wide actions are not gated on a document id', () => {
  const guard = route.indexOf("const id = String(body.id || '')")
  assert.ok(guard > 0)
  for (const action of ["action === 'draft_tier'", "action === 'collect'", "action === 'import_plan'"]) {
    const at = route.indexOf(action)
    assert.ok(at > 0, `${action} is missing`)
    assert.ok(at < guard, `${action} is below the id guard, so it can only ever answer "Missing document"`)
  }
  // And the per-document ones stay above it, because they genuinely need one.
  for (const action of ["action === 'approve'", "action === 'draft'", "action === 'read'"]) {
    assert.ok(route.indexOf(action) > guard, `${action} needs an id and must stay below the guard`)
  }
})

// A batch in flight has written nothing yet, so every document it is working
// on is still empty and still looks eligible. Pressing the button again while
// she waits submits exactly the same documents a second time and pays for
// them twice, which is what happened the first afternoon this existed.
test('a tier already being written cannot be sent again', () => {
  const submit = route.slice(route.indexOf("action === 'draft_tier'"), route.indexOf("action === 'collect'"))
  assert.match(submit, /from\('document_batches'\)[\s\S]{0,200}\.in\('status', \['submitted', 'collecting'\]\)/)
  assert.match(submit, /status: 409/)
  assert.match(submit, /pay for them twice/)

  // Refused before the submission, not after it.
  assert.ok(submit.indexOf('inFlight') < submit.indexOf('submitDraftBatch'),
    'the check has to come before the money is spent')
})

// A screen that cannot answer "is anything happening" is a screen somebody
// presses the button on again.
test('the page says what is being written right now', () => {
  assert.match(route, /const \{ data: runs \} = await admin\.from\('document_batches'\)/)
  assert.match(route, /return NextResponse\.json\(\{ rows, runs: runs \|\| \[\] \}\)/)
  assert.match(page, /Being written now/)
  assert.match(page, /written so far/)
  assert.match(page, /Nothing back yet/)
  // And a finished run that had a problem does not sit there silently.
  assert.match(page, /The last run finished with a problem/)
})
