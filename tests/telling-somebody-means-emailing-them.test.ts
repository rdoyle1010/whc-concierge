import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

// createNotification writes a row, sends a mobile push and sends an SMS to
// anybody who opted in. It has never sent an email. That is fine for a
// running conversation with somebody who is already logged in, and useless
// for reaching a person who is not.
//
// These are the paths where the platform contacts somebody who has no reason
// to be looking: a property asking for them by name, a confidential
// approach, and a shift being cancelled out from under them. Every one of
// them told the sender "the professional has been notified" and sent no
// email at all.
const MUST_EMAIL: [string, string][] = [
  ['src/app/api/swipe/route.ts', 'a property registering interest'],
  ['src/app/api/mobile/employer-matches/route.ts', 'the same thing from the app'],
  ['src/app/api/private-approach/route.ts', 'a confidential introduction'],
  ['src/app/api/agency/cancel/route.ts', 'a cancelled shift'],
]

test('first contact reaches somebody who is not logged in', () => {
  for (const [file, what] of MUST_EMAIL) {
    const source = body(file)
    assert.match(source, /send[A-Za-z]*Email\(/,
      `${what} must send an email, not only an in-app notification (${file})`)
    assert.match(source, /emailAllowed\(/,
      `${what} must respect the recipient's email preferences (${file})`)
    // The email is a courtesy on top, never a reason the action itself fails.
    assert.match(source, /catch \(emailError/,
      `a failed email must not break ${what} (${file})`)
  }
})

test('the screen does not claim more than the code does', () => {
  // "The professional has been notified" meant a bell in an app most people
  // do not have installed.
  const page = body('src/app/employer/candidates/page.tsx')
  assert.doesNotMatch(page, /The professional has been notified/,
    'say what actually happens, not the word "notified"')
  assert.match(page, /Emailed/,
    'the confirmation should name the thing that actually reaches them')
})
