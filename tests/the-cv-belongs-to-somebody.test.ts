import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { namesAgree } from '../src/lib/profile-build'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/admin/profile-build/route.ts')
const page = body('src/app/admin/profile-build/page.tsx')
const reader = body('src/lib/cv-read.ts')

// Colin sent a CV belonging to Rebecca. The reader did exactly as it was told
// and wrote the name off the document, so his account carried her name and
// her thirty year career, and it was then emailed to him. Nobody was asked
// anything at any point.
test('the name on the account is the name they gave, not the name on the file', () => {
  const applyBlock = route.slice(route.indexOf("action === 'apply_reading'"))
  assert.match(applyBlock, /full_name: String\(request\.full_name \|\| ''\)\.trim\(\) \|\| line\(reading\.full_name/,
    'the requested name wins and the document only fills a blank')
  assert.match(applyBlock, /namesAgree\(cvName, request\.full_name\)/, 'and a disagreement is reported')
  assert.match(applyBlock, /Check you have the right document/)
})

// Handing over carries somebody's career history to whoever owns the email
// address. That is the last moment the mistake is still cheap.
test('a profile in the wrong name is not sent without being asked twice', () => {
  const handoverBlock = route.slice(route.indexOf("action === 'handover'"), route.indexOf("action === 'read_cv'"))
  assert.match(handoverBlock, /namesAgree\(built\.full_name, request\.full_name\)/)
  assert.match(handoverBlock, /body\.confirm !== true/, 'and pressing again is what overrides it')
  assert.match(handoverBlock, /status: 409/)

  // The refusal has to reach a button, or it is a guard nobody meets.
  assert.match(page, /confirming === row\.id \? 'Send it anyway' : 'Send it to them'/)
  assert.match(page, /confirmed \? \{ confirm: true \} : \{\}/)
})

test('names are read forgivingly and surnames are not', () => {
  assert.ok(namesAgree('colin doyle', 'Colin Doyle'))
  assert.ok(namesAgree('Colin  Doyle', 'Colin M. Doyle'), 'a middle name is the same person')
  assert.ok(namesAgree('', 'Colin Doyle'), 'an absent name cannot disagree with anything')
  assert.ok(!namesAgree('Rebecca Doyle', 'Colin Doyle'), 'a different first name is a different person')
  assert.ok(!namesAgree('Colin Rae', 'Colin Doyle'))
})

// The SDK retries twice by default. Twenty seconds an attempt, sixty seconds
// of trying, inside a function the host kills at twenty-six: the route never
// answered at all and the screen could only say the server gave up.
test('the reader gives up before the host does', () => {
  assert.match(reader, /new Anthropic\(\{ apiKey, maxRetries: 0 \}\)/, 'one attempt, not three')
  const timeout = Number(reader.match(/const CALL_TIMEOUT_MS = (\d+)/)?.[1])
  const ceiling = Number(body('src/app/api/admin/profile-build/route.ts').match(/maxDuration = (\d+)/)?.[1])
  assert.ok(timeout > 0 && ceiling > 0)
  // Room left over for fetching the file, pulling text out of a Word
  // document and writing the answer.
  assert.ok(timeout <= (ceiling - 6) * 1000, `${timeout}ms leaves nothing inside a ${ceiling}s ceiling`)
})

// A link she cannot copy is not an error. It was shown in a red panel with
// the failure wording, which reads as "this is broken" when the link is right
// there and perfectly usable.
test('the sign-in link is shown, not thrown', () => {
  assert.doesNotMatch(page, /setError\(`Copy this/, 'a copyable link is not a failure')
  assert.match(page, /readOnly value=\{link\.url\}/, 'it is shown in a box she can select')
  assert.match(page, /\{link\.copied \? 'Copied' : 'Copy'\}/, 'with a button that tries again')
  assert.match(page, /signed out of admin/i)
})
