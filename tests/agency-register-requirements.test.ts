import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { rightToWorkVerified } from '../src/lib/verification-badges.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const DIRECTORY = 'src/app/api/agency/directory/route.ts'
const CHECKOUT = 'src/app/api/stripe/checkout/route.ts'
const SETTINGS = 'src/app/talent/agency/settings/page.tsx'
const LIST = 'src/app/agency/page.tsx'

// Supplying somebody into a shift makes Talent House an employment business.
// An employment business that has not established right to work is the one
// exposure no wording on a card covers, so it is a condition of being listed
// rather than a badge that makes a profile look better.
test('right to work is a condition of the register, not a badge', () => {
  const directory = read(DIRECTORY)
  assert.match(directory, /\.filter\(\(candidate: any\) => isAdmin \|\| rightToWorkVerified\(candidate\)\)/)
  // Beside the listing rules, not the search filters - so a direct link to a
  // profile cannot open and book somebody who may not lawfully be supplied.
  const listingRules = directory.slice(directory.indexOf('const candidates = (data || [])'), directory.indexOf('.map((candidate: any) => privateIds'))
  assert.match(listingRules, /rightToWorkVerified/)

  assert.equal(rightToWorkVerified({ right_to_work_status: 'approved' }), true)
  assert.equal(rightToWorkVerified({ right_to_work_status: 'pending' }), false)
  assert.equal(rightToWorkVerified({}), false)
})

// Selling a listing that cannot be shown is the same fault as every other one
// found this week, only in reverse.
test('the platform will not take money for a listing it cannot show', () => {
  const checkout = read(CHECKOUT)
  assert.match(checkout, /if \(!rightToWorkVerified\(cand\)\)/)
  assert.match(checkout, /code: 'RIGHT_TO_WORK_REQUIRED'/)
  assert.match(checkout, /actionHref: '\/talent\/verification'/)
  assert.match(checkout, /there is no charge for it/, 'and it is free, which is worth saying')
})

// The headline number must count the people the directory will actually show.
test('the public count applies the same rule', () => {
  assert.match(read('src/app/api/agency/public-stats/route.ts'), /\.in\('right_to_work_status', \['approved', 'verified'\]\)/)
})

// Insurance is genuinely optional - many placements sit under the property's
// own cover - but a professional who holds a policy gets offered more work,
// so the route to one belongs where they decide.
test('insurance is optional, and there is a way to get it', () => {
  const settings = read(SETTINGS)
  assert.match(settings, /Insurance <span[^>]*>Optional/)
  assert.match(settings, /Right to work <span[^>]*>Required/)
  assert.match(settings, /salongold\.co\.uk\/mobile-freelance-insurance/)
  assert.match(settings, /rel="noreferrer noopener"/, 'an outbound link is not a hole in the tab')
  assert.match(settings, /does not sell insurance or take a commission on it/, 'and the platform says where it stands')
  assert.match(read(LIST), /Optional, because many placements sit under the property/)
})

// Certificates are the first thing a spa director reads, and the card showed
// the rate, the distance and the treatments but never what the person is
// actually qualified to do.
test('certificates are on the card', () => {
  const list = read(LIST)
  assert.match(list, /rows\.push\(\{ label: 'Certificates'/)
  assert.match(list, /None on the profile yet/)
  const settings = read(SETTINGS)
  assert.match(settings, /The single thing a spa director reads first/)
})

// A professional must be able to see where they stand before they pay.
test('the professional is told what is needed before the checkout', () => {
  const settings = read(SETTINGS)
  assert.match(settings, /What the register asks for/)
  assert.match(settings, /readiness\.rightToWork/)
  assert.match(settings, /Upload your document/)
  assert.match(read('src/app/api/agency/settings/route.ts'), /right_to_work_verified:/)
})
