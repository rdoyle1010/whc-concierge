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
// The rules about which rows may be written moved out of the route so they
// could be tested without a database, and so a run of three hundred and
// thirty-eight could be saved in bulk rather than one document at a time.
const plan = body('src/lib/documents/collect-plan.ts')
const page = body('src/app/admin/documents/page.tsx')
const reader = body('src/lib/cv-read.ts')
const writer = body('src/lib/ai-write.ts')

// Omitting the thinking parameter on this model does not mean no thinking. It
// runs adaptive, which is the default and was never chosen, so every call on
// this platform was paying for a reasoning phase before producing a token.
// That is most of why they kept dying at the twenty-six second ceiling and
// reporting it as "that took too long".
test('nothing pays for thinking it never asked for', () => {
  // This asserted thinking: { type: 'disabled' } on all four. That was right
  // on Sonnet and is a documented trap on Opus: with thinking off the model
  // occasionally writes a tool call into its visible text, where nothing runs
  // it and the turn still succeeds, and it can leak internal tags into the
  // answer. Low effort is the replacement. It costs less than disabled
  // thinking did and does neither.
  for (const [name, source] of [['the CV reader', reader], ['the writing assistant', writer], ['the drafter', draft], ['the batch', batch]] as const) {
    assert.match(source, /effort: 'low'/, `${name} still runs at the default effort`)
    assert.doesNotMatch(source, /thinking: \{ type: 'disabled'( as const)? \}[^.]/,
      `${name} disables thinking, which is a trap on this model`)
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
  assert.match(plan, /target\.status === 'approved'/)
  assert.match(plan, /Object\.keys\(target\.document \|\| \{\}\)\.length > 0/)
  assert.match(plan, /status: 'draft'/)
  assert.doesNotMatch(plan, /status: 'approved',/)

  // And the route must actually be asking it.
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("const id = String"))
  assert.ok(collect.length > 200, 'the collect block was not found')
  assert.match(collect, /planCollection\(progress\.results, targets/)
})

// A receipt that never saved leaves a finished batch marked as still running,
// which means collecting it again forever.
test('every write is checked, including the bookkeeping', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("const id = String"))
  assert.match(collect, /const \{ error: noteError \}/)
  assert.match(collect, /const \{ error: receiptError \}/)
  assert.match(collect, /still marked as running/)

  // The receipt is written before the money is spent, which is the stronger
  // version of the rule this used to check.
  //
  // It was written afterwards and treated as a warning when it failed, on the
  // reasoning that a running batch should not be reported as a failure. That
  // warning carried the only record of the batch id, the screen showed the
  // success message instead of it, and two paid runs of three hundred and
  // thirty-eight documents became unreachable.
  const submit = route.slice(route.indexOf("action === 'draft_tier'"), route.indexOf("action === 'collect'"))
  assert.ok(submit.indexOf('document_batches') < submit.indexOf('submitDraftBatch'),
    'a batch that cannot be tracked must not be started')
  assert.match(submit, /Nothing was sent, and nothing has been charged/)
  assert.match(submit, /Collect a batch by id/, 'and if the id fails to save afterwards, it is put on screen')

  // A failed submission clears its own reservation, and says so if it cannot.
  assert.match(submit, /const \{ error: clearError \}/)
  assert.match(submit, /will block this tier until it is deleted/)
})

// A batch of four hundred and sixty and one press of a button must ask for
// exactly the same thing, or the library is written in two voices.
test('both paths draft from one brief and assemble one shape', () => {
  assert.match(draft, /export function draftPrompt/)
  assert.match(batch, /draftPrompt\(item\)/)
  assert.match(draft, /messages: \[\{ role: 'user', content: draftPrompt\(input\) \}\]/)
  assert.match(batch, /DRAFT_SYSTEM/)
  assert.match(batch, /DRAFT_SCHEMA/)
  assert.match(plan, /documentFromDraft\(target as any, result\.draft\)/)
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
  assert.match(route, /return NextResponse\.json\(\{ rows, runs: runs \|\| \[\], authored: authoredReferences\(\) \}\)/)
  assert.match(page, /Being written now/)
  assert.match(page, /written so far/)
  assert.match(page, /Nothing back yet/)
  // And a finished run that had a problem does not sit there silently.
  assert.match(page, /The last run finished with a problem/)
})

// The warning carried the only record of a batch id and the page showed a
// cheerful success line instead of it. Two paid runs of three hundred and
// thirty-eight documents went missing in the gap between those two facts.
test('a warning is never swallowed by a success message', () => {
  assert.match(page, /if \(body\?\.warning\) \{\s*setError\(body\.warning\)/)
  // Every handler that writes a success note checks for a warning first.
  for (const action of ["'draft_tier'", "'collect'", "'draft'", "'approve'", "'adopt_batch'"]) {
    const at = page.indexOf(`action === ${action}`)
    assert.ok(at > 0, `${action} handler is missing`)
    assert.match(page.slice(Math.max(0, at - 40), at), /!body\?\.warning && |\} else if \(/,
      `${action} can overwrite a warning with a success message`)
  }
})

// Two runs were started and paid for while the register could not be written
// to. They still exist at the provider, and their ids are in the console.
test('a batch that was started but never recorded can still be collected', () => {
  assert.match(route, /action === 'adopt_batch'/)
  assert.match(route, /\/\^\[A-Za-z0-9_-\]\{8,120\}\$\//, 'a pasted id is validated rather than trusted')
  assert.match(route, /That batch is already in the register/)
  assert.match(page, /Collect a batch by id/)
  assert.match(page, /Paste a batch id from the Anthropic console/)
})

// A register that cannot be read and a register with nothing in it are
// completely different facts.
test('collect distinguishes an empty register from an unreadable one', () => {
  const collect = route.slice(route.indexOf("action === 'collect'"), route.indexOf("action === 'adopt_batch'"))
  assert.match(collect, /const \{ data: runs, error: registerError \}/)
  assert.match(collect, /there is no way to know what is running/)
  assert.match(collect, /Nothing is waiting to come back/)
})
