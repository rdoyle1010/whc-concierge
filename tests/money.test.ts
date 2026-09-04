import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  formatSalary, formatExact, currencyForCountry, currencySymbol, CURRENCIES,
} from '../src/lib/money.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// A senior therapist role in Hong Kong at HK$45,000 rendered as "£45,000":
// wrong by roughly a factor of ten, in the direction that makes the offer look
// absurd. The therapist dismisses a good role; the hotel dismisses the
// platform.
test('a salary is written in the money it is actually paid in', () => {
  assert.equal(formatSalary(45000, 60000, 'HKD'), 'HK$45k - HK$60k')
  assert.equal(formatSalary(28000, 34000, 'GBP'), '£28k - £34k')
  assert.equal(formatSalary(120000, 150000, 'AED'), 'AED 120k - AED 150k')
  assert.equal(formatSalary(45000, 60000, 'HKD', { abbreviate: false }), 'HK$45,000 - HK$60,000')
  // An unknown or missing currency must not silently invent a different one.
  assert.equal(formatSalary(30000, 40000, null), '£30k - £40k')
})

// Below ten thousand an abbreviation hides whether a role pays 8,000 or 8,499,
// and at that end of the range the difference matters to the person reading it.
test('small figures are written out, not rounded into vagueness', () => {
  assert.equal(formatSalary(8000, 9500, 'GBP'), '£8,000 - £9,500')
  assert.equal(formatSalary(2500, null, 'GBP'), 'From £2,500')
  assert.equal(formatSalary(null, 30000, 'GBP'), 'Up to £30k')
  assert.equal(formatSalary(30000, 30000, 'GBP'), '£30k', 'a single figure is not a range')
  assert.equal(formatSalary(null, null, 'GBP'), null, 'nothing to say, rather than "£0"')
  assert.equal(formatExact(45000, 'HKD'), 'HK$45,000')
})

// A default, never a rule - so the form lets a property change it.
test('each country suggests the currency a property there would quote in', () => {
  assert.equal(currencyForCountry('HK'), 'HKD')
  assert.equal(currencyForCountry('Hong Kong'), 'HKD')
  assert.equal(currencyForCountry('GB'), 'GBP')
  assert.equal(currencyForCountry(null), 'GBP')
  assert.equal(currencyForCountry('FR'), 'EUR')
  assert.equal(currencyForCountry('AE'), 'AED')
  // Maldives resorts price in dollars, not rufiyaa, and every offer letter
  // reflects that.
  assert.equal(currencyForCountry('MV'), 'USD')
  // A country with no mapping must still produce something renderable.
  assert.equal(currencySymbol(currencyForCountry('ZZ')), '£')
})

// A stored conversion is wrong the day after it is written, and a salary
// quoted in the wrong currency at yesterday's rate is worse than one quoted
// plainly in its own.
test('no exchange rate is stored or applied anywhere', () => {
  const lib = read('src/lib/money.ts')
  assert.ok(!/exchange|convert|fx_rate|rate\s*[:=]\s*\d/i.test(lib.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')),
    'the number a property types is the number a professional sees')
  const sql = read('supabase/migrations/20260903140000_job_currency.sql')
  assert.match(sql, /default 'GBP'/, 'every role posted before this was in pounds')
})

test('every currency the platform offers can be rendered', () => {
  for (const currency of CURRENCIES) {
    assert.ok(currency.symbol.length > 0, `${currency.code} needs a symbol`)
    assert.ok(currency.name.length > 0, `${currency.code} needs a name`)
    assert.match(formatSalary(50000, 60000, currency.code) || '', /50k/, `${currency.code} must format`)
  }
  assert.equal(new Set(CURRENCIES.map(c => c.code)).size, CURRENCIES.length, 'no duplicates')
})

// A form field that is read and thrown away is worse than one that is absent:
// the hotel believes it posted a Hong Kong role and the platform advertises a
// UK one, mapped to Yorkshire and priced in pounds.
test('the country and currency a property picks actually reach the database', () => {
  const route = read('src/app/api/employer/jobs/create/route.ts')
  const start = route.indexOf('const ALLOWED_FIELDS')
  const allowed = route.slice(start, route.indexOf('] as const', start))
  for (const field of ['country_code', 'location_city', 'salary_currency']) {
    assert.ok(allowed.includes(`'${field}'`), `${field} is dropped before it reaches the database`)
  }
  // A currency the platform cannot render would print a pound sign in front of
  // a Hong Kong figure, which is the exact bug this replaced.
  assert.match(route, /CURRENCIES\.some\(known => known\.code === currency\)/, 'an unknown currency is rejected')
  assert.match(route, /currencyForCountry\(roleCountry\)/, 'and falls back to what the country would quote in')
})

test('every salary a member sees goes through the formatter', () => {
  for (const page of [
    'src/app/roles/page.tsx',
    'src/app/jobs/[id]/page.tsx',
    'src/app/jobs/page.tsx',
    'src/app/talent/jobs/page.tsx',
  ]) {
    const source = read(page)
    assert.match(source, /formatSalary\(/, `${page} must format rather than assume pounds`)
    // A hardcoded pound beside a salary figure is the bug coming back.
    assert.ok(!/£\$\{[^}]*salary/i.test(source), `${page} still hardcodes a pound sign on a salary`)
  }
  // The cached page key had to move, or every cached response keeps serving
  // rows with no currency on them.
  assert.match(read('src/app/api/jobs/public/route.ts'), /public-jobs-page-v6/,
    'the cache key must change when the shape of a cached row does')
  assert.match(read('src/app/api/jobs/public/route.ts'), /salary_currency/, 'and the currency must be carried')
})

// On a board still mostly British, "Harrogate, United Kingdom" on every card
// is noise - and noise is what stops "Male, Maldives" standing out.
test('a country is shown where it tells you something', () => {
  const page = read('src/app/roles/page.tsx')
  assert.match(page, /function overseasLocation/)
  assert.match(page, /if \(isUnitedKingdom\(country\)\) return place/, 'home roles read as they always did')
  assert.match(page, /place\.toLowerCase\(\) === named\.toLowerCase\(\)/, 'and "Hong Kong, Hong Kong" is avoided')
})
