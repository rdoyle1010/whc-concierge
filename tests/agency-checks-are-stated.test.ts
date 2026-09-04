import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const LIST = 'src/app/agency/page.tsx'
const PROFILE = 'src/app/agency/[id]/page.tsx'

// Somebody joined as talent, ticked the Agency Register, uploaded nothing and
// completed no checks - and appeared on a page headed "Verified spa
// professionals" under a panel explaining how Talent House verifies everybody
// on it. Both statements were about the register as a whole, and both were
// untrue of the only person on it.
test('the page no longer says everyone listed has been checked', () => {
  const list = read(LIST)
  assert.ok(!/Verified spa professionals, on cover/.test(list), 'the headline claimed the whole register')
  assert.ok(!/Search verified, insured professionals who have confirmed/.test(list), 'so did the search intro')
  assert.match(list, /What the marks on a profile mean/)
  assert.match(list, /A profile without one has not been through it/)
  assert.match(list, /Somebody who has just joined the register does not carry this mark/)
})

// A missing badge is invisible. A property scanning cards notices one that is
// there and never notices one that is not, so an unchecked professional read
// exactly like a fully checked one.
test('a card states what has not been checked, not only what has', () => {
  const list = read(LIST)
  assert.match(list, /Identity not yet verified/)
  assert.match(list, /No insurance on file/)
  // Always rendered, never conditional on there being something good to say.
  assert.match(list, /rows\.push\(\{ label: 'Checks'/)
  assert.ok(!/if \(verifiedLine\) rows\.push/.test(list), 'the row must not disappear when both checks are missing')
})

// The profile is the page with the offer button on it, and it was the quietest
// of the lot: a chain where "verified" won, "insured" was the fallback, and
// neither showed nothing.
test('the page you make an offer from says both, separately', () => {
  const profile = read(PROFILE)
  assert.match(profile, /profile\.whc_verified \? 'Talent House Verified' : 'Identity not yet verified'/)
  assert.match(profile, /profile\.has_insurance \? 'Insured' : 'No insurance on file'/)
  assert.ok(!/whc_verified \? <span[^>]*>.*?<\/span> : profile\.has_insurance &&/s.test(profile),
    'one check must not hide the other')
})

// The marks themselves still mean what they say: they are computed from the
// documents, not from having joined.
test('the marks are still earned', () => {
  const directory = read('src/app/api/agency/directory/route.ts')
  assert.match(directory, /const agencyReady = Boolean\(candidate\.whc_verified\)/)
  assert.match(directory, /&& insuranceCurrent/)
  assert.match(directory, /&& rightToWorkVerified\(candidate\)/)
  // An expired certificate is not insurance.
  assert.match(directory, /new Date\(candidate\.insurance_expiry_date\)\.getTime\(\) >= Date\.now\(\)/)
})
