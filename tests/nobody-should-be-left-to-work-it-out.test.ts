import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { launchOfferOpen, launchOfferClosesLabel } from '../src/lib/launch-offers'
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
    const steps = html.match(/letter-spacing:\.14em;text-transform:uppercase;color:#6e6a60;">0\d</g) || []
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
  // A way to act on it, whatever that way currently is. This pinned the
  // mailto, so pointing the offer at the page built for it - which asks for
  // the CV rather than hoping somebody attaches one - failed a test about
  // whether the offer appears at all.
  assert.match(open, /href="(mailto:hello@talenthousecollective\.co\.uk|https:\/\/talenthousecollective\.co\.uk\/set-up-my-profile)/)
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

// The button for a blank box refused to work until the box was filled in.
//
// The AI writing route read the caller's saved row and returned 404, "We could
// not find your practice", when there was not one. A consultancy row is only
// created on first save, so a consultant filling the form for the first time
// got that from the one button built for somebody staring at a blank box. The
// owner, with a saved listing, could not reproduce it.
test('the writing assistant works before the practice has been saved', () => {
  const route = readFileSync('src/app/api/ai/write/route.ts', 'utf8')
  const practice = route.slice(route.indexOf("field === 'practice_headline'"), route.indexOf("const { data: employer }"))
  // The phrase survives in the comment explaining why it went. What must not
  // survive is the refusal: a missing row is the normal state of a first
  // visit, not an error.
  assert.doesNotMatch(practice, /error: 'We could not find your practice'/,
    'a missing row is the normal state of a first visit, not an error')
  assert.match(practice, /typed\('practice_name'\)/, 'it reads what is in the form')
  assert.match(practice, /slice\(0, 2000\)/, 'and caps what it will take from a request body')
  // Typed beats saved: somebody who has changed three fields and not pressed
  // save wants a draft about their screen, not about last week.
  assert.match(practice, /typed\('summary'\) \|\| data\?\.summary/)
  // With nothing at all to go on it says what to do, rather than inventing a
  // practice or failing silently.
  assert.match(practice, /then press this again/)
})

test('the consultancy form sends what is in its boxes', () => {
  const page = readFileSync('src/app/talent/consultancy/page.tsx', 'utf8')
  assert.match(page, /const typedSoFar = \(\) => \(\{/)
  const uses = page.match(/context=\{typedSoFar\(\)\}/g) || []
  assert.equal(uses.length, 2, 'both the headline and the about box send it')
})

// "I pressed Use this and nothing came up."
//
// It cleared the panel and put the text in the field, which sits above the
// button. On a long form that field is often off the top of the screen, so
// from where the person is looking the panel vanished and nothing replaced it.
// It also never said the text was unsaved, so the other reading was that it
// had saved itself, which this tool promises never to do.
test('taking a draft says where it went and that it is not saved', () => {
  const component = readFileSync('src/components/AiWrite.tsx', 'utf8')
  assert.match(component, /setTook\(true\)/, 'accepting is recorded')
  assert.match(component, /Put in the box above/)
  assert.match(component, /Nothing is saved until you press Save/)
  // And asking again clears it, or a stale confirmation sits under a new draft.
  assert.match(component, /setBusy\(true\); setError\(''\); setTook\(false\)/)
})

// A rewrite that loses an award has made the profile worse, however well it
// reads. This is the commonest way an assistant like this does damage: it
// smooths a specific claim somebody earned into a description of the category
// they work in.
test('the writing prompts protect what somebody has earned', () => {
  const prompts = readFileSync('src/lib/ai-write.ts', 'utf8')
    + readFileSync('src/lib/house-style.ts', 'utf8')
  assert.match(prompts, /What must survive, always:/)
  assert.match(prompts, /An award, a title, a qualification, a named brand/)
  assert.match(prompts, /If what they had is better, return theirs unchanged/)
  // Writing a fresh one still mines the old one for facts, rather than
  // throwing away every credential in it along with the wording.
  assert.match(prompts, /It is not prose to preserve, it is a source of facts/)
})

// A code a campaign can carry, issued from the screen that already issues
// codes.
//
// This was a hardcoded constant for one campaign until somebody pointed at
// Ambassadors, which already issued codes with places, an expiry, an audience
// and attribution. The admin screen and the redeem route both existed and
// worked; nothing in the product ever asked anybody for a code, so the whole
// scheme was a form nobody could reach. That was the fault, not the missing
// constant.
test('the offer covers September and October and then stops', () => {
  // The hour matters. British Summer Time ends on 25 October 2026, so the
  // close is midnight UTC on the first of November and the open is an hour
  // before the UTC date changes on the first of September. An offer that says
  // "to the end of October" and closes on the thirtieth for everybody reading
  // it in this country is a broken promise, not a rounding error.
  assert.ok(!launchOfferOpen(new Date('2026-08-31T22:00:00Z')), 'not yet open in London')
  assert.ok(launchOfferOpen(new Date('2026-09-01T00:30:00Z')), 'open on 1 September')
  assert.ok(launchOfferOpen(new Date('2026-10-31T23:00:00Z')), 'still open on 31 October')
  assert.ok(!launchOfferOpen(new Date('2026-11-01T00:30:00Z')), 'closed on 1 November')
  assert.equal(launchOfferClosesLabel(), '31 October 2026')
})

test('a code typed at registration is claimed against the issued codes', () => {
  const route = readFileSync('src/app/api/register/init/route.ts', 'utf8')
  assert.match(route, /claimCode\(admin, data\.user\.id, typedCode/)
  // The constant is gone; the only mention left is the comment saying why.
  assert.doesNotMatch(route, /import.*SIGNUP_CODE/, 'no second place for a code to live')
  // The courses land whether or not a code was typed. A gate would mean
  // somebody who found the site on their own gets less than somebody who saw
  // an advert, which is the wrong way round.
  assert.match(route, /if \(launchOfferOpen\(\)\) \{/)
  // And a code that will not claim never costs somebody their account.
  assert.match(route, /not claimed/)
})

test('both places that honour a code use the same one', () => {
  const shared = readFileSync('src/lib/ambassador-codes.ts', 'utf8')
  assert.match(shared, /claim_ambassador_code/, 'one atomic claim, so two people cannot take the last place')
  assert.match(shared, /redemptions_used: used - 1/, 'a wrong-audience claim gives the place back')
  for (const caller of ['src/app/api/ambassador/redeem/route.ts', 'src/app/api/register/init/route.ts']) {
    assert.match(readFileSync(caller, 'utf8'), /from '@\/lib\/ambassador-codes'/, caller)
  }
})

test('the sign-up form asks for a code and does not demand one', () => {
  const page = readFileSync('src/app/register/talent/page.tsx', 'utf8')
  assert.match(page, /params\.get\('code'\)/, 'a campaign link fills the box in')
  assert.match(page, /signupCode: signupCode \|\| undefined/, 'and it is sent')
  assert.match(page, /Both courses are yours either way/)
})
