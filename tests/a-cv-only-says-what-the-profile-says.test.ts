import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const ROUTE = 'src/app/api/talent/cv/route.ts'
const PDF = 'src/lib/candidate-cv-pdf.tsx'

test('a CV can only ever be your own', () => {
  // A downloadable document keyed on an id somebody can pass in is how a
  // photograph, a location and a full name leak.
  const route = body(ROUTE)
  assert.match(route, /getRequestUser\(req\)/)
  assert.match(route, /\.eq\('user_id', user\.id\)/,
    'the profile must be found from the session, never from a parameter')
  assert.doesNotMatch(route, /searchParams|body\.candidateId|params\./,
    'there must be no way to ask for somebody else')
})

test('it is generated, not stored', () => {
  // A CV written to storage is a public URL waiting to be guessed. This one
  // is built per request and never cached by anything in between.
  const route = body(ROUTE)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
  assert.doesNotMatch(route, /storage\.from\(/, 'the CV must not be written to a bucket')
})

test('a certificate on it can be checked', () => {
  const route = body(ROUTE)
  assert.match(route, /\.not\('completed_at', 'is', null\)/, 'only completed courses appear')
  assert.match(route, /row\.certificate_code/, 'and only ones carrying a verification code')

  const pdf = body(PDF)
  assert.match(pdf, /certificate\.code/, 'the code must be printed, or it cannot be verified')
})

test('an unfinished profile still gets a CV, and is told what is missing', () => {
  // Blocking the download until the profile is perfect removes the very
  // thing that makes somebody go and finish it.
  const page = body('src/app/talent/profile/page.tsx')
  assert.match(page, /\/api\/talent\/cv/, 'the download must be on the profile page')
  assert.match(page, /still empty and will simply be missing from the page/,
    'the screen should say what an incomplete profile will leave off')

  const route = body(ROUTE)
  assert.doesNotMatch(route, /completionPct|profile_completion/,
    'the route must not refuse an incomplete profile')
})
