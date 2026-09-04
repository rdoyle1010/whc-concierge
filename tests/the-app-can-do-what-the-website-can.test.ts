import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('the phone can reach Shift Resolution, a copy of your data, and deletion', () => {
  // Every one of these authenticated by reading a cookie, which a phone does
  // not have. Shift Resolution is the dispute route, and a shift goes wrong
  // while somebody is standing in a spa. The other two are rights under the
  // UK GDPR, and the app that collects the CV, the right-to-work document and
  // the photograph offered no way to ask for any of it back.
  for (const route of [
    'src/app/api/agency/cases/route.ts',
    'src/app/api/data-export/route.ts',
    'src/app/api/account/delete/route.ts',
  ]) {
    const source = body(route)
    assert.match(source, /getRequestUser\(req\)/,
      `${route} must accept a bearer token, not only a browser cookie`)
    assert.doesNotMatch(source, /from 'next\/headers'/,
      `${route} still reads cookies directly, so the app cannot reach it`)
  }
})

test('the three screens exist and are reachable from the home menu', () => {
  const screens: [string, string][] = [
    ['mobile/app/agency-cases.tsx', '/agency-cases'],
    ['mobile/app/saved.tsx', '/saved'],
    ['mobile/app/settings.tsx', '/settings'],
  ]
  const home = body('mobile/app/home.tsx')
  for (const [file, href] of screens) {
    assert.ok(existsSync(file), `${file} is missing`)
    assert.ok(home.includes(`'${href}'`),
      `nothing in the home menu links to ${href}, so the screen cannot be found`)
  }
})

test('opening a case says plainly that it holds the money', () => {
  // Opening a case freezes the payout on that booking. Somebody deciding
  // whether to raise one is entitled to know that before they tap, not after.
  const source = body('mobile/app/agency-cases.tsx')
  assert.match(source, /holds the payout|payout on this shift is held/i,
    'the screen must say that opening a case holds the payout')
  assert.match(source, /action: 'open'/, 'the screen must be able to open a case')
  assert.match(source, /action: 'respond'/, 'the other side must be able to respond')
  assert.match(source, /action: 'message'/, 'both sides must be able to keep talking')
})

test('deleting an account takes more than one tap and tells the truth', () => {
  const source = body('mobile/app/settings.tsx')
  assert.match(source, /CONFIRM_WORD/, 'deletion must require typing a confirmation')
  assert.match(source, /cannot be undone/i, 'the screen must say the deletion is permanent')
  // Payment and tax records are kept and anonymised. Saying "everything is
  // deleted" when it is not would be a promise the platform cannot keep.
  assert.match(source, /anonymised/i,
    'the screen must be honest that legally required records are kept and anonymised')
})
