import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  countryCode,
  countryName,
  isUnitedKingdom,
  comparableLocations,
  productAvailableIn,
  unavailableReason,
  countriesByRegion,
  COUNTRIES,
} from '../src/lib/countries.ts'
import { distanceMiles, profileDistanceMiles } from '../src/lib/geo.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// 'United Kingdom' from a column default, 'UK' typed by a person, 'England'
// typed by another. Matching on the raw string means a candidate in one never
// meets a role in the next, which reads as no results rather than as a data
// problem nobody can see.
test('one country has one answer, however it was typed', () => {
  for (const written of ['GB', 'gb', 'UK', 'United Kingdom', 'england', 'Scotland', 'Great Britain']) {
    assert.equal(countryCode(written), 'GB', `${written} must resolve to GB`)
  }
  for (const written of ['AE', 'UAE', 'Dubai', 'United Arab Emirates']) {
    assert.equal(countryCode(written), 'AE', `${written} must resolve to AE`)
  }
  assert.equal(countryCode('Narnia'), null)
  assert.equal(countryCode(''), null)
  assert.equal(countryName('uk'), 'United Kingdom')
})

// Every row that existed before country did was British: the column defaulted
// to United Kingdom and the platform took nobody else. Reading blank as "not
// UK" would take agency away from the people already using it.
test('a blank country is treated as the United Kingdom', () => {
  assert.equal(isUnitedKingdom(null), true)
  assert.equal(isUnitedKingdom(''), true)
  assert.equal(isUnitedKingdom('  '), true)
  assert.equal(isUnitedKingdom('AE'), false)
  assert.equal(productAvailableIn('agency', null), true, 'existing members keep agency')
})

// Placing somebody into a shift makes Talent House an employment business,
// which is licensed country by country. The other three lines are advertising
// and introduction, and they travel.
test('agency stops at the border and the rest do not', () => {
  assert.equal(productAvailableIn('agency', 'GB'), true)
  assert.equal(productAvailableIn('agency', 'AE'), false)
  assert.equal(productAvailableIn('agency', 'MV'), false)
  for (const product of ['roles', 'residency', 'consultancy'] as const) {
    for (const country of ['GB', 'AE', 'MV', 'US', 'TH']) {
      assert.equal(productAvailableIn(product, country), true, `${product} must work in ${country}`)
    }
  }
  // A member reads this, so it has to say why rather than refuse.
  const reason = unavailableReason('agency')
  assert.match(reason, /United Kingdom only/)
  assert.match(reason, /employment business/, 'the reason is the law, and saying so is what makes it credible')
  assert.match(reason, /Roles, Residency and Consultancy/, 'and it points at what they can still use')
})

// The haversine is happy to report that a therapist in Leeds is 5,000 miles
// from a resort in the Maldives, and every consumer of that number treats it
// as a commute: radius filters, "within travel distance", nearest-first
// shortlists. A cross-border figure is not a small number, it is a
// meaningless one.
test('distance is not reported across a border', () => {
  const leeds = { latitude: 53.8, longitude: -1.55, location_country: 'GB' }
  const london = { latitude: 51.5, longitude: -0.13, location_country: 'GB' }
  const male = { latitude: 4.17, longitude: 73.51, location_country: 'MV' }

  const domestic = profileDistanceMiles(leeds, london)
  assert.ok(domestic !== null && domestic > 150 && domestic < 200, `Leeds to London should be ~170 miles, got ${domestic}`)

  assert.equal(profileDistanceMiles(leeds, male), null, 'a cross-border distance must not be produced')

  // The maths itself still works globally - it is the interpretation that is
  // country-scoped, not the formula.
  const raw = distanceMiles(leeds, male)
  assert.ok(raw > 4000, `the haversine still computes it: ${raw}`)

  // Two rows with no country recorded are both British, so they compare.
  assert.equal(comparableLocations(null, null), true)
  assert.equal(comparableLocations('UK', 'United Kingdom'), true)
  assert.equal(comparableLocations('GB', 'AE'), false)
})

test('the country list covers the markets that hire and is grouped to be read', () => {
  const codes = new Set(COUNTRIES.map(country => country.code))
  // The luxury spa world, not a UN member list.
  for (const expected of ['GB', 'AE', 'MV', 'CH', 'FR', 'US', 'TH', 'MU', 'SA', 'ID', 'IE', 'OM', 'QA']) {
    assert.ok(codes.has(expected), `${expected} must be selectable`)
  }
  assert.equal(codes.size, COUNTRIES.length, 'no duplicate codes')
  const regions = countriesByRegion()
  assert.equal(regions[0].region, 'United Kingdom & Ireland', 'the home market opens the list, not Antigua')
  assert.equal(regions.reduce((total, group) => total + group.countries.length, 0), COUNTRIES.length)
})

// A form is a suggestion; the server is the rule. Every route that can put
// somebody into a shift has to enforce the border itself.
test('the agency border is enforced on the server, not only in a form', () => {
  const settings = read('src/app/api/agency/settings/route.ts')
  assert.match(settings, /productAvailableIn\('agency'/, 'joining the register is gated')

  const core = read('src/app/api/agency/booking/core.ts')
  const create = core.slice(core.indexOf("if (action === 'create')"))
  assert.match(create.slice(0, 1200), /productAvailableIn\('agency'/, 'booking a shift is gated')

  // A professional abroad who ticked the register must not be offered to a
  // property, because the booking that follows cannot lawfully be made.
  const directory = read('src/app/api/agency/directory/route.ts')
  assert.match(directory, /country_code\.eq\.GB/, 'and the directory never offers them')

  // A role abroad is postable; it just cannot be an agency shift.
  const jobs = read('src/app/api/employer/jobs/create/route.ts')
  assert.match(jobs, /payload\.is_agency_role = false/, 'the checkbox is cleared, not the whole role refused')
})

// A therapist in Muscat has no postcode. Requiring one left every non-UK
// member off the map, and therefore out of every list that sorts by location.
test('somewhere without a postcode can still be placed on the map', () => {
  const geo = read('src/lib/geo.ts')
  assert.match(geo, /export async function geocodeLocation/)
  assert.match(geo, /nominatim/, 'a global geocoder for everywhere postcodes.io does not cover')
  assert.match(geo, /User-Agent/, "and it identifies itself, as Nominatim's policy requires")
  // A UK row can hold a town rather than a postcode, and should still resolve.
  assert.match(geo, /United Kingdom`\)/, 'a UK town falls through to the global lookup')
})

// A London group hiring for its resort in the Maldives is the ordinary case.
// Inheriting the property's pin would put every distance out by four
// thousand miles.
test('a role carries its own country, not its property one', () => {
  const jobs = read('src/app/api/employer/jobs/create/route.ts')
  assert.match(jobs, /const sameCountry =/, 'the fallback to the property is country-scoped')
  const fallback = jobs.slice(jobs.indexOf('const sameCountry ='))
  assert.match(fallback.slice(0, 500), /sameCountry && employer\.latitude/, "the property's pin is only borrowed at home")
})

test('the country columns exist and every old row is accounted for', () => {
  const sql = read('supabase/migrations/20260903120000_international.sql')
  for (const table of ['candidate_profiles', 'employer_profiles', 'job_listings', 'consultancy_profiles']) {
    assert.ok(sql.includes(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS country_code text`), `${table} needs a country`)
    assert.ok(sql.includes(`UPDATE ${table} SET country_code = 'GB'`), `${table} rows predating this are British`)
  }
  assert.match(sql, /open_to_countries text\[\]/, 'talent must be able to say where they would go')
  assert.match(sql, /USING gin \(open_to_countries\)/, 'and that is an array-containment query')
  const statements = sql.match(/CREATE INDEX/g) ?? []
  const guarded = sql.match(/CREATE INDEX IF NOT EXISTS/g) ?? []
  assert.equal(statements.length, guarded.length, 'every index must be safe against what is already live')
})

// The field that makes international worth having: a resort cannot find a
// therapist who would move there unless she can say she would.
test('talent can say which countries they would work in', () => {
  const profile = read('src/app/talent/profile/page.tsx')
  assert.match(profile, /<CountryMultiSelect/, 'the choice is on the profile')
  assert.match(profile, /open_to_countries/, 'and it is saved')
  assert.match(read('src/app/api/profile/update/route.ts'), /'open_to_countries'/, 'and allowed through to the database')
  assert.match(read('src/app/employer/post-role/page.tsx'), /<CountrySelect/, 'a role says where it is')
})
