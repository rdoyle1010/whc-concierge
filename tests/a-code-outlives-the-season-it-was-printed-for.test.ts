import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LAUNCH_OFFER_CLOSES, launchOfferOpen } from '../src/lib/launch-offers'
import { codeMatchKey, normaliseCode } from '../src/lib/ambassador-codes'

// A code that stops working on a date nobody chose.
//
// SPA-WELL26 was about to be printed on a campaign. Two things would have
// happened on the first of November, both silently.
//
// The registration route claimed codes inside `if (launchOfferOpen())`, so the
// claim would simply not run. The account would still be created, the person
// would see nothing wrong, and the only trace would be a line in a Netlify
// function log nobody reads.
//
// And the field to type a code into lived inside the opening-season panel, so
// it would have disappeared from the form at the same moment. A code with no
// box is not a degraded feature, it is a poster pointing at nothing.
//
// The two things are independent and now are. The offer is a blanket gift
// inside a window. A code carries its own expiry, its own places and its own
// audience, which is the entire reason for issuing one from a screen rather
// than hardcoding it.

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const ROUTE = 'src/app/api/register/init/route.ts'
const FORM = 'src/app/register/talent/page.tsx'

test('a code is claimed whatever month it is', () => {
  const route = body(ROUTE)

  // The claim must not sit inside the window check. Proximity is the only
  // thing text can measure, so this asserts the shape that was wrong: a
  // launchOfferOpen guard with the claim inside its braces.
  const windowBlock = route.match(/if \(launchOfferOpen\(\)\) \{([\s\S]*?)\n {10}\}/)
  if (windowBlock) {
    assert.doesNotMatch(windowBlock[1], /claimCode\(/,
      'claiming a code must not depend on the opening season still running')
  }

  assert.match(route, /claimCode\(admin, data\.user\.id, typedCode/,
    'registration must still claim a typed code')
  assert.match(route, /if \(launchOfferOpen\(\)\) \{[\s\S]{0,300}?grantCourses\(/,
    'the blanket gift does still belong inside the window')
})

test('the box to type it into is not seasonal either', () => {
  const form = body(FORM)

  // The input must not be inside the launchOfferOpen block. Same shape test:
  // find the seasonal panel and assert the field is not in it.
  const seasonal = form.match(/\{launchOfferOpen\(\) && \(([\s\S]*?)\n {12}\)\}/)
  assert.ok(seasonal, 'the opening-season panel should still be seasonal')
  assert.doesNotMatch(seasonal[1], /signupCode/,
    'the code field must live outside the seasonal panel, or it vanishes with it')

  assert.match(form, /value=\{signupCode\}/, 'the field must still exist')
  assert.match(form, /Code, if you have one/,
    'and still read as optional, because a field that looks compulsory loses signups')
})

test('the courses a code grants are reported back, not just the seasonal ones', () => {
  // Somebody redeeming a code in December should be told what they got. The
  // route reported only the blanket grant, which outside the window is an
  // empty list, so a successful redemption looked like nothing had happened.
  assert.match(body(ROUTE), /claimed\.granted\.length\) launchOfferGranted = claimed\.granted/)
})

test('the season itself is unchanged', () => {
  // Nothing here moves the offer. It still opens and closes when it did, and
  // the close is still midnight London on the thirty-first of October rather
  // than midnight UTC, because British Summer Time ends on the twenty-fifth.
  assert.equal(LAUNCH_OFFER_CLOSES, '2026-11-01T00:00:00Z')
  assert.equal(launchOfferOpen(new Date('2026-10-31T22:00:00Z')), true)
  assert.equal(launchOfferOpen(new Date('2026-11-01T00:00:00Z')), false)
})

test('a code typed off a poster is the same code', () => {
  // The lookup forgave the case and the outer spaces and nothing else, while
  // the comment beside it claimed loose matching. Somebody reading SPA-WELL26
  // off an Instagram caption types it four different ways, and three of them
  // were told we did not recognise their code.
  const forms = ['SPA-WELL26', 'spa well 26', 'spawell26', ' SPA WELL 26 ', 'Spa_Well26']
  const keys = new Set(forms.map(codeMatchKey))
  assert.equal(keys.size, 1, `these should be one code: ${[...keys].join(', ')}`)
  assert.equal([...keys][0], 'SPAWELL26')

  // The stored value keeps its punctuation, because SPA-WELL26 is what goes
  // on the poster and what should read back on the admin list.
  assert.equal(normaliseCode('spa-well26'), 'SPA-WELL26')
})

test('the database is where the matching happens', () => {
  // Comparing in TypeScript would mean reading every code out of the table to
  // find one, and the claim has to stay a single locked statement.
  const migration = readFileSync('supabase/migrations/20260915140000_a_code_typed_off_a_poster.sql', 'utf8')
  assert.match(migration, /regexp_replace\(upper\(code\), '\[\^A-Z0-9\]', '', 'g'\)/)
  assert.match(migration, /FOR UPDATE/, 'and it must still take the row lock')

  // Only the matching changed. The expiry comparison and the write order were
  // both altered by accident while retyping the body, and both are back.
  assert.match(migration, /v\.expires_at < now\(\)/)
  assert.doesNotMatch(migration, /v\.expires_at <= now\(\)/)
})

test('two codes cannot differ only by a hyphen', () => {
  // The UNIQUE constraint does not catch this: SPA-WELL26 and SPAWELL26 are
  // different strings and the same code, and the lookup would return whichever
  // row it found first.
  const route = readFileSync('src/app/api/admin/ambassadors/route.ts', 'utf8')
  assert.match(route, /codeMatchKey\(row\.code\) === key/)
})
