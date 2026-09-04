import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const LIST = 'src/app/agency/page.tsx'

// The search lived in component state alone. Set a date and a postcode, open
// somebody, press Back, and the whole thing was gone - on a screen whose
// entire job is "who can work this shift, near me", which meant starting again
// every time you looked at anybody.
test('the search is carried in the address bar', () => {
  const list = read(LIST)
  assert.match(list, /useState\(\(\) => urlParam\('postcode'\)\)/)
  assert.match(list, /useState\(\(\) => urlParam\('radius', 'UK-wide'\)\)/)
  assert.match(list, /useState\(\(\) => urlParam\('shiftDate'\)\)/)
  assert.match(list, /useState\(\(\) => urlParam\('shiftStartTime', '09:00'\)\)/)
  assert.match(list, /useState\(\(\) => urlParam\('shiftEndTime', '17:00'\)\)/)
})

// Writing it on every search is what puts it in the history entry, which is
// what Back returns to.
test('every search records itself', () => {
  const list = read(LIST)
  assert.match(list, /function rememberSearch\(params: URLSearchParams\)/)
  assert.match(list, /window\.history\.replaceState\(null, '', query \? `\/agency\?\$\{query\}` : '\/agency'\)/)
  // Both routes into a search, and the clear.
  const searches = list.match(/rememberSearch\(params\)/g) || []
  assert.ok(searches.length >= 3, 'a postcode search, a UK-wide search and the shift-only case must all record')
  assert.match(list, /window\.history\.replaceState\(null, '', '\/agency'\)/, 'and clearing empties it')
})

// Restoring has to use the coordinates already worked out, not geocode again
// on every Back.
test('coming back restores the search rather than resetting it', () => {
  const list = read(LIST)
  assert.match(list, /const restored = new URLSearchParams/)
  assert.match(list, /savedLat && savedLng && savedRadius && savedRadius !== 'UK-wide'/)
  assert.match(list, /setAppliedSearch\(\{ outward, radius: savedRadius \}\)/, 'and the "near BS1" chip comes back with it')
})

// The rule was already right and simply never stated: results are measured
// from the property and exclude anyone whose own radius does not reach it.
test('the form says what the search actually does', () => {
  assert.match(read(LIST), /nobody is shown whose own travel radius does not reach you/)
})
