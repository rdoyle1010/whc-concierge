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
  assert.match(route, /isAdmin \|\| id \|\| candidate\.within_radius/, 'a single profile must not be dropped for being outside a radius')
  assert.match(route, /isAdmin \|\| id \|\| !hasShiftSearch/, 'nor for being busy on the shift searched for')
})

// A property is never asked for a search radius when it signs up, and a
// UK-wide search deliberately stores none. So "set a search radius" was a
// demand for a preference the product had never requested - it refused
// searches, and it refused to open a profile the same search had just
// returned.
test('an unset radius means the whole country, not an error', () => {
  const route = read(ROUTE)
  assert.ok(!/Set a search radius before looking for Agency Talent/.test(route),
    'an unset preference must not block the register')
  assert.match(route, /No radius set means UK-wide, not an error/)
  // The professional's own travel radius is the limit that actually matters.
  assert.match(read('src/lib/discovery.ts'), /candidateRadius/, 'still honoured through mutualRadiusResult')
  const unset = mutualRadiusResult(
    { latitude: 51.45, longitude: -2.58 },
    { latitude: 51.38, longitude: -2.36, travel_radius_miles: 30 } as any,
    null,
  )
  assert.equal(unset.withinRadius, true, 'no property radius means everyone willing to travel is shown')
  const tooFar = mutualRadiusResult(
    { latitude: 51.45, longitude: -2.58 },
    { latitude: 55.95, longitude: -3.19, travel_radius_miles: 30 } as any,
    null,
  )
  assert.equal(tooFar.withinRadius, false, 'but the professional still decides how far they will go')
})

// A property that has not added a postcode gets the register with the distance
// simply unknown, rather than a locked screen.
test('an unmapped property is not locked out of the register', () => {
  assert.match(read(ROUTE), /or search UK-wide/)
  const unknown = mutualRadiusResult({}, { latitude: 51.38, longitude: -2.36 } as any, null)
  assert.equal(unknown.withinRadius, true)
  assert.equal(unknown.reason, 'distance_unknown')
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
