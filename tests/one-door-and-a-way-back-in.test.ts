import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Two admin sign-in pages, and the fix went into the wrong one.
//
// /admin-sign-in and /admin/login were the same form, the same imports, the
// same submit. They differed by one line, and it was the line that mattered.
//
// /admin/login had gained a "Forgotten your password?" link carrying
// ?role=admin, because an administrator who had forgotten hers was otherwise
// sent to /forgot-password, which returned her to /login, which is built to
// refuse admin accounts. A closed loop, and the reason an administrator once
// concluded her account was broken. That fix is in the repository with a
// comment explaining exactly why it was needed.
//
// It went into one copy. The footer, which is the only way a person finds the
// staff door by looking, linked to the other one - the one that still dead
// ended. Fixing a page maintained in two places fixes one of them.
//
// So: one door now, and this file holds it to one.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('there is one admin sign-in page, not two', () => {
  // The old address still resolves, because bookmarks exist, but it must not
  // be a second copy of the form.
  const legacy = body('src/app/admin-sign-in/page.tsx')
  assert.match(legacy, /redirect\('\/admin\/login'\)/, 'the old address must hand over, not duplicate')
  assert.doesNotMatch(legacy, /useState|<form|type="password"/,
    'a second sign-in form is a second place for a fix to miss')
})

test('every way in points at the same door', () => {
  const proxy = body('src/proxy.ts')
  const door = proxy.match(/loginUrl\.pathname = '(\/admin[^']*)'/)?.[1]
  assert.ok(door, 'the proxy must name one admin door')

  // The proxy sends a signed-out administrator there, so the links a person
  // can actually click have to agree with it.
  for (const file of ['src/components/Footer.tsx', 'src/components/DoorsClosed.tsx']) {
    const source = body(file)
    assert.ok(source.includes(`href="${door}"`), `${file} must link to ${door}`)
    assert.doesNotMatch(source, /href="\/admin-sign-in"/,
      `${file} still points at the old address, which is how the two drifted apart`)
  }

  // And that door must be exempt from the guard over its own prefix, or it
  // bounces a signed-out administrator to a page built to refuse her.
  assert.match(proxy, new RegExp(`AUTH_PAGES = \\[[^\\]]*'${door}'`),
    `${door} sits inside a protected prefix and must be listed as an auth page`)
})

test('the one door has a way back in', () => {
  // The whole point. Somebody locked out needs recovery from the page she is
  // looking at, and it has to carry the role or it returns her to the member
  // sign-in, which refuses admin accounts.
  const page = read('src/app/admin/login/page.tsx')
  assert.match(page, /\/forgot-password\?role=admin/,
    'without the role, recovery ends at the door that rejects her')

  // And the recovery page has to honour it rather than ignore an unknown role.
  const forgot = read('src/app/forgot-password/page.tsx')
  assert.match(forgot, /role/, 'the recovery page must read the role it was handed')
})

test('the staff door is not a page a search engine lists', () => {
  const robots = read('src/app/robots.ts')
  assert.match(robots, /'\/admin\/'/, 'the admin prefix covers the real door')
  assert.match(robots, /'\/admin-sign-in'/, 'and the old address, so no crawler follows a hop to find out')
})

// Signed-in tools render an empty shell to a crawler. An empty shell carrying
// a real page's title is a duplicate of a page that should rank.
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

  // Not a robots Disallow, and the distinction is the point: Disallow stops
  // the crawl, and a page Google cannot fetch is a page whose noindex it never
  // reads, so anything already indexed stays indexed.
  const robots = read('src/app/robots.ts')
  for (const route of ['/roles/match', '/residency/create', '/mobile-return']) {
    assert.doesNotMatch(robots, new RegExp(`'${route}'`),
      `${route} is noindex; disallowing it as well stops Google ever seeing that`)
  }
})
