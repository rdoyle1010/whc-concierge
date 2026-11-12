import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

// A property advertising agency cover at £130-160 a day was told on its own
// dashboard: "Salary is approximately 100% below the market median. Market
// median £31,500." Which is true only in the sense that a day and a year are
// different lengths.
//
// It cut both ways. Agency day rates sat in the same pool as annual salaries,
// so they also dragged the median down for every permanent role measured
// against it - quietly, and in the direction that flatters the platform's
// own listings.
test('a day rate is never compared against an annual median', () => {
  const route = read('src/app/api/employer/intelligence/route.ts')

  assert.match(route, /function paidByDay/, 'nothing distinguishes a day rate from a salary')

  const block = route.slice(route.indexOf('const marketMidpoints = ['), route.indexOf('].filter((value)'))
  assert.match(block, /paidByDay\(other\) === paidByDay\(job\)/,
    'the comparison pool still mixes day rates with annual salaries')
  assert.match(block, /paidByDay\(job\)\s*\n?\s*\?\s*\[\]/,
    'annual salary records are still pulled into a day-rate comparison')
})

test('the intelligence query loads what it needs to tell them apart', () => {
  const route = read('src/app/api/employer/intelligence/route.ts')
  // Both the property's own roles and the platform-wide pool. Missing it on
  // either side puts day rates back in the median through the other door.
  const selects = [...route.matchAll(/\.select\('([^']*salary_min[^']*)'\)/g)].map(m => m[1])
  assert.ok(selects.length >= 2, 'the sweep must see both salary queries')
  for (const select of selects) {
    assert.match(select, /is_agency_role/, `a salary query does not load is_agency_role: ${select}`)
    assert.match(select, /contract_type/, `a salary query does not load contract_type: ${select}`)
  }
})

test('agency cover in the demonstration data is a day rate, as it should be', () => {
  // The listing that exposed this. If it ever becomes an annual figure the
  // bug stops being reproducible and the fix stops being exercised.
  const demo = read('src/lib/demo-data.ts')
  const block = demo.slice(demo.indexOf("'Spa Therapist - weekend cover'"))
  const slice = block.slice(0, block.indexOf('},'))
  assert.match(slice, /is_agency_role: true/)
  const min = Number((slice.match(/salary_min: (\d+)/) || [])[1])
  assert.ok(min > 0 && min < 1000, `a day rate should look like one, got ${min}`)
})
