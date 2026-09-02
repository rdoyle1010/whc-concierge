import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Before launch the shop window stays lit and the doors stay shut. The gate
// has to sit in a layout: a page that renders and then hides itself has
// already shipped the sign-in form to the browser.

test('sign-in and registration are gated in a layout, not in the page', () => {
  for (const gate of ['src/app/login/layout.tsx', 'src/app/register/layout.tsx']) {
    const source = read(gate)
    assert.match(source, /doorsClosedFor/, `${gate} must check the platform access state`)
    assert.match(source, /DoorsClosed/, `${gate} must show the waiting list rather than the form`)
  }
})

test('admin sign-in is never gated', () => {
  // Closing the doors must not lock the owner out of her own platform.
  assert.doesNotMatch(read('src/app/admin-sign-in/page.tsx'), /doorsClosedFor/)
})

test('the closed panel captures the email rather than sending people away', () => {
  const panel = read('src/components/DoorsClosed.tsx')
  assert.match(panel, /api\/newsletter\/subscribe/, 'it must join the same double opt-in list')
  assert.match(panel, /Join the list/)
})

test('access fails open, and the preview cannot be an open redirect', () => {
  const lib = read('src/lib/platform-access.ts')
  // A database wobble must not close the platform to everyone.
  assert.match(lib, /closed: false, previewCode: ''/, 'a failed read must leave the doors open')
  const route = read('src/app/api/preview/route.ts')
  assert.match(route, /startsWith\('\/'\) && !nextPath\.startsWith\('\/\/'\)/, 'the return path must stay on this site')
  assert.match(route, /supplied !== previewCode/, 'a wrong code must not set the cookie')
})

// platform_config.value is a json column, and the migration file that says
// otherwise is out of date. A value set by hand in the SQL editor therefore
// arrives as the JSON string "closed" while the admin form writes it parsed.
test('the access flag is read the same whichever route set it', async () => {
  const { readConfigString } = await import('../src/lib/platform-access')
  assert.equal(readConfigString('closed'), 'closed')
  assert.equal(readConfigString('"closed"'), 'closed')
  assert.equal(readConfigString('  "closed"  '), 'closed')
  assert.equal(readConfigString(null), '')
  assert.equal(readConfigString(undefined), '')
})
