import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mutualRadiusResult } from '../src/lib/discovery.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const ROUTE = 'src/app/api/agency/directory/route.ts'
const PAGE = 'src/app/agency/[id]/page.tsx'

// A property searched the Agency Register, found one professional at zero
// miles, clicked "View profile and make an offer" and was told the profile did
// not exist.
//
// The profile page asks the directory for one id and nothing else - no radius,
// no map point. Those defaulted to whatever was stored on the property, and a
// UK-wide search deliberately stores nothing. So the search that found her
// refused to open her, and the refusal was a radius error the page never
// showed.
test('opening one professional is a lookup, not a search', () => {
  const route = read(ROUTE)
  assert.match(route, /if \(!isAdmin && !id && !ukWide && !radius\)/, 'a single profile must not demand a search radius')
  assert.match(route, /if \(!isAdmin && !id && \(origin\.latitude == null/, 'nor a mapped property')
  assert.match(route, /isAdmin \|\| id \|\| candidate\.within_radius/, 'nor drop the person for being outside it')
  assert.match(route, /isAdmin \|\| id \|\| !hasShiftSearch/, 'nor for being busy on the shift searched for')
})

// Distance and availability still have to reach the page - they are things a
// property needs to read before making an offer, not things to hide.
test('the profile still carries the distance and the availability', () => {
  const route = read(ROUTE)
  const shaped = route.slice(route.indexOf('distance_miles: result.distanceMiles'), route.indexOf('reliability_pct'))
  assert.match(shaped, /within_radius: result\.withinRadius/)
  assert.match(shaped, /distance_status: result\.reason/)
  assert.match(shaped, /availability_match: availabilityMatch/)

  // Somebody 40 miles out is still reachable, and still described as 40 miles
  // out rather than silently dropped.
  const far = mutualRadiusResult({ latitude: 51.45, longitude: -2.58 }, { latitude: 51.38, longitude: -2.36 } as any, 5)
  assert.equal(far.withinRadius, false)
  assert.ok(far.distanceMiles && far.distanceMiles > 5, 'the real distance is still worked out')
})

// The remaining gates are the ones that should stop an offer, and they stay.
test('who may be looked up is unchanged', () => {
  const route = read(ROUTE)
  assert.match(route, /An approved employer account is required/)
  assert.match(route, /\.eq\('approval_status', 'approved'\)/, 'the professional is approved')
  assert.match(route, /\.eq\('agency_available', true\)/, 'and on the register')
  assert.match(route, /country_code\.eq\.GB,country_code\.is\.null/, 'and in the country the product is licensed for')
  assert.match(route, /canEmployerDiscoverCandidate\(candidate, blockedIds\)/, 'stealth and blocks still apply')
  assert.match(route, /agency_listed_until/, 'and a lapsed listing is still gone')
})

// The one message a property saw was the one thing that was not wrong.
test('a failure says what actually failed', () => {
  const page = read(PAGE)
  assert.match(page, /if \(!directoryRes\.ok\) setLoadError\(directoryJson\?\.error/)
  assert.match(page, /\{loadError \|\| 'Profile not found\.'\}/)
  // And the genuine not-found now says what it means.
  assert.match(read(ROUTE), /no longer available on the Agency Register/)
})
