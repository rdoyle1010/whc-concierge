import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { COMPANY_TYPES, PROPERTY_TYPES } from '../src/lib/constants'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

/** Source with comments stripped: a thing named in prose is not a thing done. */
const body = (source: string) => source
  .split('\n').filter(line => !line.trim().startsWith('//')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

// Every email a member gets carried one person's personal Outlook address in
// its footer. On a platform selling to hotel directors, a reply-to at
// outlook.com undoes a good deal of what the rest of the design is doing - and
// with a second partner on the business it is now factually wrong as well.

test('no member-facing email replies to a personal inbox', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8')
        // Free webmail in a mailto: is the tell. A company domain is fine.
        if (/mailto:[^"'\s]*@(outlook|hotmail|gmail|yahoo|aol|live)\./i.test(source)) {
          offenders.push(path.replace(process.cwd() + '/', ''))
        }
      }
    }
  }
  walk(join(process.cwd(), 'src'))
  assert.deepEqual(offenders, [],
    `These put a personal inbox in front of a member:\n  ${offenders.join('\n  ')}`)
})

test('the templates point at the company address', () => {
  for (const file of [
    'src/lib/application-email-templates.ts',
    'src/lib/decision-email-templates.ts',
    'src/lib/job-alert-email-template.ts',
    'src/lib/welcome-email-template.ts',
  ]) {
    assert.match(read(file), /hello@wellnesshousecollective\.co\.uk/,
      `${file} must reply to the company address`)
  }
})

// The Brands door has been live since it was built and unusable, because a
// brand could not say it was a brand. Clinics, day spas, cruise lines and
// retreats employ more qualified therapists between them than hotels do.
test('an employer who is not a hotel can say what they are', () => {
  for (const needed of [
    'Day Spa', 'Clinic', 'Wellness Retreat',
    'Cruise', 'Product House or Brand', 'Gym or Health Club',
  ]) {
    assert.ok((COMPANY_TYPES as readonly string[]).includes(needed),
      `an employer must be able to describe themselves as "${needed}"`)
  }
  // Nothing an employer already saved may disappear from the list underneath them.
  for (const original of ['Hotel', 'Resort', 'Spa', 'Clinic', 'Cruise', 'Other']) {
    assert.ok((COMPANY_TYPES as readonly string[]).includes(original),
      `"${original}" was already in use and must survive`)
  }
})

test('where the work happens is chosen, not typed as a slug', () => {
  // The field asked a spa director for "hotel_spa, day_spa, resort" and then
  // printed whatever they wrote on the public job page.
  const page = body(read('src/app/employer/profile/page.tsx'))
  assert.match(page, /PROPERTY_TYPES\.map/, 'property type must be a list')
  assert.doesNotMatch(page, /hotel_spa, day_spa/, 'and must not ask for database slugs')
  assert.ok((PROPERTY_TYPES as readonly string[]).includes('Head Office'),
    'a brand educator does not work in a spa, so Head Office has to be sayable')
})

test('the job form says whose team it is counting', () => {
  // The matcher now scores team scale outside leadership, which is only
  // defensible because the question is unambiguous.
  for (const file of ['src/app/employer/post-role/page.tsx', 'src/app/employer/jobs/page.tsx']) {
    assert.match(read(file), /Team size this role leads/,
      `${file} must say whose team the number describes`)
  }
})
