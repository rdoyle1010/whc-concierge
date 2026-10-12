import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

// The owner could not get into her own platform, and the check in this file
// said everything was fine.
//
// src/app/admin/layout.tsx guards every path beneath it: no session, and it
// redirects away. A layout wraps its own children, so a sign-in page at
// /admin/login was guarded by it too. A signed-out administrator never
// reached the form. She was sent to /login, which refuses admin accounts and
// told her administrators sign in at /admin, which arrived back at the
// layout. A closed loop with no way out, and the footer's staff link pointed
// straight into it.
//
// There is an AUTH_PAGES list in the proxy that exists to prevent exactly
// this, and the previous version of this file asserted the door was on it.
// That assertion passed the whole time. The proxy and the layout are two
// separate guards, and exempting a path from one says nothing about the
// other - so a check aimed at the wrong mechanism looked exactly like a
// check that passes.
//
// The rule now: walk the layouts that actually wrap the sign-in page and
// prove none of them turns a signed-out visitor away. That is the thing that
// was broken, so that is the thing this file tests.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** The route segment that holds the sign-in form, read from the proxy. */
function adminDoor(): string {
  // The admin override specifically, not the member default a few lines above.
  const door = body('src/proxy.ts')
    .match(/matchesRoutePrefix\(pathname, '\/admin'\)\) loginUrl\.pathname = '(\/[a-z0-9/-]+)'/)?.[1]
  assert.ok(door, 'the proxy must name one admin door')
  return door
}

/** Every layout.tsx that wraps a page, innermost first. */
function layoutsWrapping(pageFile: string): string[] {
  const found: string[] = []
  let dir = dirname(pageFile)
  while (dir.startsWith('src/app') || dir === 'src/app') {
    const layout = join(dir, 'layout.tsx')
    if (existsSync(layout)) found.push(layout)
    if (dir === 'src/app') break
    dir = dirname(dir)
  }
  return found
}

test('nothing wrapping the admin sign-in page turns a signed-out visitor away', () => {
  const door = adminDoor()
  const page = `src/app${door}/page.tsx`
  assert.ok(existsSync(page), `${door} must be a real page, not a redirect into a guarded prefix`)

  for (const layout of layoutsWrapping(page)) {
    const source = body(layout)
    // The exact shape that locked her out: read the session, find nobody,
    // send them somewhere else. On a sign-in page that is a closed door.
    const guards = /getUser\(\)[\s\S]{0,400}?if \(!\s*(user|session)[^)]*\)\s*\{?\s*redirect\(/.test(source)
    assert.equal(guards, false,
      `${layout} wraps the sign-in page and redirects a signed-out visitor away from it`)
  }
})

test('the sign-in form is not underneath the admin guard', () => {
  const door = adminDoor()
  // The hyphen is load-bearing. '/admin-sign-in' does not match the '/admin'
  // prefix; '/admin/login' does, and that one difference is the whole bug.
  assert.doesNotMatch(door, /^\/admin\//,
    `${door} sits under the guarded prefix, which is where the form cannot live`)

  const guard = body('src/app/admin/layout.tsx')
  assert.match(guard, /redirect\('\/admin-sign-in'\)/,
    'a signed-out visitor to any admin URL must be sent to the door, not to the member page')
  assert.doesNotMatch(guard, /if \(!user\) \{\s*redirect\('\/login'\)/,
    'sending them to /login is the loop: that page refuses admin accounts')
})

test('there is one sign-in form, and the old address hands over to it', () => {
  const door = adminDoor()
  const legacy = body('src/app/admin/login/page.tsx')
  assert.match(legacy, new RegExp(`redirect\\('${door}'\\)`), 'the old address must hand over')
  assert.doesNotMatch(legacy, /useState|<form|current-password/,
    'a second sign-in form is a second place for a fix to miss')

  const real = body(`src/app${door}/page.tsx`)
  assert.match(real, /autoComplete="current-password"/, 'the door must actually be the form')
  assert.match(real, /role: 'admin'/, 'and it must sign in as an administrator')
})

test('every way in points at the door, including the refusal that sends her there', () => {
  const door = adminDoor()
  for (const file of ['src/components/Footer.tsx', 'src/components/DoorsClosed.tsx']) {
    assert.ok(body(file).includes(`href="${door}"`), `${file} must link to ${door}`)
  }

  // The member sign-in page refuses an admin account and names where to go.
  // It named /admin, which is guarded, so the instruction closed the loop it
  // was written to open.
  const refusal = body('src/app/api/auth/login/route.ts')
  assert.match(refusal, new RegExp(`talenthousecollective\\.co\\.uk${door}`),
    'the refusal must name a door a signed-out administrator can actually open')
  assert.doesNotMatch(refusal, /co\.uk\/admin,/, 'naming /admin sends her back into the guard')
})

test('the one door has a way back in', () => {
  const door = adminDoor()
  const page = read(`src/app${door}/page.tsx`)
  // Without the role, recovery returns her to /login, which refuses admin
  // accounts. The link has to carry it.
  assert.match(page, /\/forgot-password\?role=admin/,
    'recovery without the role ends at the door that rejects her')
  assert.match(read('src/app/forgot-password/page.tsx'), /role/,
    'the recovery page must read the role it was handed')
})

test('the staff door is taken out of the index, not hidden from it', () => {
  const door = adminDoor()
  const layout = read(`src/app${door}/layout.tsx`)
  assert.match(layout, /index: false/, 'the staff door has no business in a search result')

  // Not a robots Disallow. Disallow stops the crawl, and a page Google cannot
  // fetch is a page whose noindex it never reads, so anything already indexed
  // stays indexed. This page was crawlable for a fortnight.
  assert.doesNotMatch(read('src/app/robots.ts'), new RegExp(`'${door}'`),
    `${door} is noindex; disallowing it as well stops Google ever seeing that`)
})

test('signed-in tools are taken out of the index, not merely hidden from it', () => {
  for (const [route, layout] of [
    ['/roles/match', 'src/app/roles/match/layout.tsx'],
    ['/residency/create', 'src/app/residency/create/layout.tsx'],
    ['/app-return', 'src/app/app-return/layout.tsx'],
    ['/mobile-return', 'src/app/mobile-return/layout.tsx'],
  ]) {
    const source = read(layout)
    assert.match(source, /index: false, follow: true/, `${route} must be noindex, follow`)
    assert.match(source, /title: \{ absolute:/, `${route} must not inherit a parent's title`)
  }
})
