import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  audienceFor,
  onboardingEmailHtml,
  onboardingSubject,
  type OnboardingAudience,
} from '../src/lib/onboarding-email'
import { employerStrength, SETUP_HELP_LIMIT } from '../src/lib/onboarding-accounts'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const AUDIENCES: OnboardingAudience[] = ['talent', 'employer', 'consultant', 'residency', 'agency']

// A platform with six things in it is a platform somebody bounces off. They
// arrive for one reason, fill in half a profile, and never find the other
// five - so an hour later one email says what the place is for, in the
// language of the door they came in through.
test('every audience gets an email written for the door they came in through', () => {
  const seen = new Set<string>()
  for (const audience of AUDIENCES) {
    const html = onboardingEmailHtml({ firstName: 'Ana', audience, setupOfferOpen: false })
    assert.match(html, /Welcome in, Ana/)
    // Not a tour of everything: the two to four things that change what the
    // platform can do for this person.
    const steps = html.match(/letter-spacing:\.14em;text-transform:uppercase;color:#6b6b6b;">0\d</g) || []
    assert.ok(steps.length >= 2, `${audience} should get at least two steps, got ${steps.length}`)
    assert.ok(steps.length <= 4, `${audience} should not get a tour, got ${steps.length}`)
    seen.add(onboardingSubject({ firstName: 'Ana', audience, setupOfferOpen: false }))
  }
  // Four distinct subjects across five audiences: agency and talent differ,
  // consultant and residency differ. A single subject for everybody would
  // mean the audience split bought nothing.
  assert.ok(seen.size >= 4, `expected the subject to change with the audience, saw ${seen.size}`)
})

// Somebody who has already ticked themselves available for shifts came here
// for the shifts.
test('the agency email leads with shifts and still asks for the profile', () => {
  const agency = onboardingEmailHtml({ firstName: 'Ana', audience: 'agency', setupOfferOpen: false })
  const talent = onboardingEmailHtml({ firstName: 'Ana', audience: 'talent', setupOfferOpen: false })
  assert.ok(agency.indexOf('Pick up a shift') < agency.indexOf('Finish your profile'))
  assert.ok(talent.indexOf('Finish your profile') < talent.indexOf('Pick up a shift'))
  // Leading with shifts must not lose the profile, because the profile is
  // what the shift matching reads.
  assert.match(agency, /Finish your profile/)
})

// The offer that only makes sense while it is possible.
test('the first-fifty offer appears only while it is open', () => {
  const open = onboardingEmailHtml({ firstName: 'Ana', audience: 'talent', setupOfferOpen: true })
  const closed = onboardingEmailHtml({ firstName: 'Ana', audience: 'talent', setupOfferOpen: false })
  assert.match(open, /first fifty/)
  assert.match(open, /mailto:hello@talenthousecollective\.co\.uk/)
  assert.doesNotMatch(closed, /first fifty/)
  assert.equal(SETUP_HELP_LIMIT, 50)
})

// Telling a person who joined last week that they signed up an hour ago is a
// machine talking to itself.
test('the opening line matches when they actually signed up', () => {
  const fresh = onboardingEmailHtml({ firstName: 'Ana', audience: 'talent', setupOfferOpen: false, justSignedUp: true })
  const late = onboardingEmailHtml({ firstName: 'Ana', audience: 'talent', setupOfferOpen: false, justSignedUp: false })
  assert.match(fresh, /signed up an hour or so ago/)
  assert.doesNotMatch(late, /an hour or so ago/)
  assert.match(late, /You have an account with us/)
})

// Somebody at 30% does not need a chart, they need to know which two things
// are worth ten minutes.
test('the email names the gap rather than showing a score alone', () => {
  const html = onboardingEmailHtml({
    firstName: 'Ana', audience: 'talent', setupOfferOpen: false,
    strength: { score: 40, missing: ['Profile photo', 'Qualifications', 'Bio (50+ words)', 'Transport method'] },
  })
  assert.match(html, /40% complete/)
  assert.match(html, /profile photo, qualifications, bio/)
  // Four gaps listed is a chore list. Three is a morning.
  assert.doesNotMatch(html, /transport method/)

  // A finished profile is not told it is unfinished.
  const done = onboardingEmailHtml({
    firstName: 'Ana', audience: 'talent', setupOfferOpen: false,
    strength: { score: 100, missing: [] },
  })
  assert.doesNotMatch(done, /complete<\/strong>/)
})

// The name on the account arrives as free text, and an apostrophe or an angle
// bracket in it must not become markup in somebody's inbox.
test('a name is escaped before it reaches the email', () => {
  const html = onboardingEmailHtml({
    firstName: '<script>alert(1)</script>', audience: 'talent', setupOfferOpen: false,
  })
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html, /&lt;script&gt;/)
})

test('the audience is read from what the account actually is', () => {
  assert.equal(audienceFor({ role: 'employer' }), 'employer')
  assert.equal(audienceFor({ role: 'talent', accountFocus: 'consultant' }), 'consultant')
  assert.equal(audienceFor({ role: 'talent', hasResidencyListing: true }), 'residency')
  assert.equal(audienceFor({ role: 'talent', agencyAvailable: true }), 'agency')
  assert.equal(audienceFor({ role: 'talent' }), 'talent')
  // A property is a property whatever else is set on it.
  assert.equal(audienceFor({ role: 'employer', accountFocus: 'consultant', agencyAvailable: true }), 'employer')
})

// A scorer that can never award a point lies by exactly that many points. The
// live-role field is not a column on the property row, so it is fetched and
// injected rather than quietly counted as missing forever.
test('a property can actually reach one hundred per cent', () => {
  const complete = {
    property_name: 'The Grand', contact_name: 'Ana Reid', phone: '0123', logo_url: 'x',
    gallery_urls: ['a'], description: Array(45).fill('word').join(' '), location: 'Bath',
    website: 'https://x', treatment_rooms: 6, product_houses: ['Carol Joy'],
    hotel_brand: 'Independent', has_live_role: true,
  }
  const scored = employerStrength(complete)
  assert.equal(scored.score, 100, `a fully filled property scored ${scored.score}: ${scored.missing.join(', ')}`)
  assert.deepEqual(scored.missing, [])

  const empty = employerStrength(null)
  assert.equal(empty.score, 0)
  assert.ok(empty.missing.includes('A live role'))

  const sweep = body('src/lib/onboarding-accounts.ts')
  assert.match(sweep, /job_listings/, 'the live role has to be fetched, not assumed absent')
  assert.match(sweep, /has_live_role: withLiveRole\.has\(row\.id\)/)
})

// One send per person. A run that fires twice in a minute still sends one
// email each, because the ledger is the log the sender writes itself.
test('the sweep will not email the same person twice', () => {
  const route = body('src/app/api/onboarding/sweep/route.ts')
  assert.match(route, /!account\.onboardingEmail/, 'the guard is the absence of a log row')
  assert.match(route, /kind: 'onboarding'/)
  const accounts = body('src/lib/onboarding-accounts.ts')
  assert.match(accounts, /from\('email_log'\)[\s\S]{0,120}eq\('kind', 'onboarding'\)/)
})

// No session behind a scheduled run, and no open door either.
test('the sweep is reachable by the schedule and by an administrator, and nobody else', () => {
  const route = body('src/app/api/onboarding/sweep/route.ts')
  assert.match(route, /isInternalApiRequest\(req\)/)
  assert.match(route, /role !== 'admin'/)
  assert.match(route, /status: 401/)
  assert.match(route, /status: 403/)

  const scheduled = body('netlify/functions/onboarding-emails.mts')
  assert.match(scheduled, /x-whc-internal-secret/)
  assert.match(scheduled, /\/api\/onboarding\/sweep/)
  // Hourly, because an hour after signing up is the entire point of it.
  assert.match(scheduled, /schedule: '\d+ \* \* \* \*'/)
  // A missing secret must not turn into an unauthenticated call.
  assert.match(scheduled, /if \(!secret\)/)
})

// candidate_profiles carries no email column at all - a professional's
// address lives in auth.users - and the two tables spell the ones they do
// carry differently. Naming a column that is not there does not come back
// null, it fails the entire query, so nobody in the batch gets anything.
test('reading an account back never names a column that might not exist', () => {
  for (const file of ['src/app/api/onboarding/sweep/route.ts', 'src/app/api/admin/onboarding/route.ts']) {
    const route = body(file)
    assert.doesNotMatch(route, /select\('[^']*\bwork_email\b[^']*'\)/, `${file} names work_email in a select`)
    assert.doesNotMatch(route, /from\('candidate_profiles'\)\.select\('[^']*email/, `${file} asks candidate_profiles for an email column`)
  }
  // And the address is resolved through one helper, which falls through to
  // auth.users when the row has nothing on it.
  const accounts = body('src/lib/onboarding-accounts.ts')
  assert.match(accounts, /auth\.admin\.getUserById\(userId\)/)
  assert.match(accounts, /row\?\.email \|\| row\?\.contact_email \|\| row\?\.work_email/)
})

// An hour later means the first run after they signed up, not the second.
test('the age band catches somebody on the first sweep after they join', () => {
  const route = body('src/app/api/onboarding/sweep/route.ts')
  const older = Number((route.match(/OLDER_THAN_HOURS = ([\d.]+)/) || [])[1])
  assert.ok(older > 0, 'they must have had a chance to look round first')
  assert.ok(older < 1, `a strict hour misses the first hourly run: ${older}`)

  const scheduled = body('netlify/functions/onboarding-emails.mts')
  const minute = Number((scheduled.match(/schedule: '(\d+) \*/) || [])[1])
  // Whatever minute the sweep runs at, somebody signing up just after it must
  // be old enough by the next one.
  assert.ok(older * 60 <= 60, 'the band has to be reachable within one hour')
  assert.ok(minute >= 0 && minute < 60)
})
