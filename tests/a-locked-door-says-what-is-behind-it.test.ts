import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

// Two things a signed-in walkthrough found, both invisible from the code.

// A property pressing "Discover Talent" is bounced to billing with
// ?locked=talent-search. The billing page ignored it, so the page was headed
// "Billing & Payment", said nothing about talent search, and the only upsell
// on it was Featured Hotel at £49/month - a different product. The highest
// intent a property ever shows, spent selling them the wrong thing.
test('the billing page says which locked feature sent them there', () => {
  const billing = read('src/app/employer/billing/page.tsx')
  assert.match(billing, /locked/, 'the billing page never reads the reason it was given')
  assert.match(billing, /LOCKED_COPY/)
  assert.match(billing, /Talent search is part of Employer Pro/)
})

test('every premium route the proxy guards has wording on the other side', () => {
  const proxy = read('src/proxy.ts')
  const billing = read('src/app/employer/billing/page.tsx')

  const block = proxy.slice(proxy.indexOf('EMPLOYER_PREMIUM_ROUTES'), proxy.indexOf('const BLOCKED_API_ROUTES'))
  const keys = [...block.matchAll(/:\s*'([a-z-]+)'/g)].map(m => m[1])
  assert.ok(keys.length >= 2, 'the sweep must actually see the premium routes')

  for (const key of keys) {
    assert.ok(
      billing.includes(`'${key}'`) || billing.includes(`${key}:`),
      `a property bounced off ${key} lands on billing with nothing explaining why`,
    )
  }
})

// An approved property was told "Employers can find you in search results",
// which is the one sentence that cannot be true of a hotel. The destination
// was branched by type; the wording was not.
test('an approved property is not told it will be found by employers', () => {
  const admin = read('src/app/admin/users/page.tsx')
  const approve = admin.slice(admin.indexOf('const approve ='), admin.indexOf('const reject ='))

  assert.doesNotMatch(
    approve.replace(/\/\/[^\n]*/g, ''),
    /type === 'candidate' \? '\/talent\/dashboard'[\s\S]{0,120}notify\([^)]*Employers can find you/,
    'both sides are still sent the same approval wording',
  )
  assert.match(approve, /Property approved/, 'a property gets no wording of its own')
  assert.match(approve, /publish roles/)
})
