import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ALLOWANCE_BUCKETS, ALLOWANCE_DEFAULT, allowancePeriod, exhaustedMessage,
  fieldIsMetered, isMeteredTier, limitFor, limitIsSane,
} from '../src/lib/ai-allowance'

// "I cannot afford a pound each person who logs in."
//
// She could not, and she was never going to: logging in costs nothing, and a
// member who uses every AI feature on the platform costs single-digit pence.
// But a cost that cannot be stated confidently is a cost that gets feared, and
// the answer to the fear was not a paywall.
//
// Putting the profile writer behind membership would have been the expensive
// mistake. What this platform sells to hotels is a register of well-presented
// professionals; a thin profile is unsold stock, and the writer is what turns
// one into the other. Charging for it is charging people to fill in our own
// catalogue, at the moment a new member is most likely to leave.
//
// So: free, and bounded. These tests hold the bound, and the three things that
// make a bound honest rather than annoying.

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('the ceiling a free member can reach is small and knowable', () => {
  // Measured from the token counts these routes really send, at Sonnet rates:
  // roughly 0.6p a profile write and 1.8p a CV read. If either default grows
  // past what those numbers make sensible, this fails and somebody has to say
  // why out loud.
  const worstCase = ALLOWANCE_DEFAULT.profile_writing * 0.6 + ALLOWANCE_DEFAULT.cv_reading * 1.8
  assert.ok(worstCase <= 30,
    `a free member could reach ${worstCase.toFixed(1)}p a month, which is no longer the small number this was sold as`)

  // And generous enough that nobody filling in their own profile honestly
  // meets it. A limit a real member hits is not a cost control, it is a lost
  // member.
  assert.ok(ALLOWANCE_DEFAULT.profile_writing >= 20)
  assert.ok(ALLOWANCE_DEFAULT.cv_reading >= 3)
})

test('the revenue event is never metered', () => {
  // A property that cannot face writing an advert does not post the job, and
  // a posted job is where this platform earns. Putting a meter in front of
  // that to save a fraction of a penny is the most expensive economy going.
  for (const field of ['employer_about', 'employer_tagline', 'job_description', 'property_policy']) {
    assert.equal(fieldIsMetered(field), false, `${field} is employer content and must stay free`)
  }
  for (const field of ['talent_bio', 'talent_headline', 'talent_commercial', 'practice_about']) {
    assert.equal(fieldIsMetered(field), true, `${field} is register content and is metered`)
  }
})

test('paying members are not metered', () => {
  for (const tier of ['pro', 'group', 'Premium']) {
    assert.equal(isMeteredTier(tier), false, `${tier} pays, and should not be counting presses`)
  }
  for (const tier of ['', null, undefined, 'free', 'none']) {
    assert.equal(isMeteredTier(tier), true)
  }
})

test('two tabs cannot both spend the last one', () => {
  // Reading the count in the route and writing it back afterwards is the bug
  // that lets somebody double-click past a limit, and it is invisible until
  // somebody does. The whole check-and-increment happens inside a row lock.
  const server = body('src/lib/ai-allowance-server.ts')
  assert.match(server, /rpc\('claim_ai_allowance'/,
    'the claim must be one database statement, not a read followed by a write')

  const migration = readFileSync('supabase/migrations/20260915120000_what_the_free_ones_get.sql', 'utf8')
  assert.match(migration, /for update/i, 'the claim has to take the row lock')
  assert.match(migration, /if v_used >= p_limit then/, 'and check the limit inside it')
})

test('a call that produced nothing does not count', () => {
  // Somebody who pressed a button that timed out has not had their turn.
  // Charging them for it is how a generous allowance comes to feel mean.
  const server = body('src/lib/ai-allowance-server.ts')
  assert.match(server, /rpc\('release_ai_allowance'/)

  const writeRoute = body('src/app/api/ai/write/route.ts')
  assert.match(writeRoute, /if \(!result\.ok\) \{[\s\S]*?releaseAllowance/,
    'the writer must hand the claim back when the draft fails')

  const cvRoute = body('src/app/api/cv/analyse/route.ts')
  assert.match(cvRoute, /releaseAllowance/,
    'the CV reader must hand the claim back when it falls back to plain extraction')
})

test('a spent allowance degrades rather than refuses, where there is something to fall back to', () => {
  // The CV route already drops to plain extraction whenever the model is
  // unavailable. An exhausted allowance is the same situation: the member
  // still gets their CV parsed, just not the good version, and they are told
  // which it was.
  const cvRoute = body('src/app/api/cv/analyse/route.ts')
  assert.match(cvRoute, /if \(!claim\.ok\) \{\s*lastAiFailure = claim\.error/,
    'an exhausted CV allowance must fall back, not return an error page')
})

test('the limit is enforced on the server, never in the browser', () => {
  // A limit a client enforces is a suggestion.
  const clientFiles = ['src/app/admin/ai-allowances/page.tsx']
  for (const file of clientFiles) {
    assert.doesNotMatch(body(file), /claim_ai_allowance|claimAllowance/,
      `${file} runs in a browser and must not be where an allowance is decided`)
  }
  assert.match(body('src/app/api/ai/write/route.ts'), /await claimAllowance\(/)
})

test('a limit cannot be saved with an extra digit', () => {
  assert.equal(limitIsSane(25).ok, true)
  assert.equal(limitIsSane(0).ok, true, 'zero is a real decision: it switches the feature off')
  assert.equal(limitIsSane(-1).ok, false)
  assert.equal(limitIsSane(2500).ok, false, '2500 a month each is not generosity, it is an unnoticed bill')
  assert.equal(limitIsSane('twenty').ok, false)
  assert.equal(limitIsSane(12.5).ok, false)
})

test('an override can always be put back', () => {
  for (const bucket of ALLOWANCE_BUCKETS) {
    assert.equal(limitFor(bucket, {}), ALLOWANCE_DEFAULT[bucket],
      'with no override the code default applies')
    assert.equal(limitFor(bucket, { [bucket]: 7 }), 7)
  }
  // Deleting the row restores the default, rather than typing the old number
  // back in: a number typed back stops being the default the day it changes.
  assert.match(body('src/app/api/admin/ai-allowances/route.ts'), /action === 'reset'[\s\S]*?\.delete\(\)/)
})

test('the month is the same month everywhere', () => {
  // Local time would give somebody in Sydney a fresh allowance most of a day
  // before somebody in Yorkshire, and the reset would land mid-afternoon.
  assert.equal(allowancePeriod(new Date('2026-01-31T23:59:59Z')), '2026-01')
  assert.equal(allowancePeriod(new Date('2026-02-01T00:00:00Z')), '2026-02')
  assert.equal(allowancePeriod(new Date('2026-12-01T00:00:00Z')), '2026-12')
})

test('running out is never a dead end', () => {
  const message = exhaustedMessage('profile_writing', 25)
  assert.match(message, /resets/, 'say when it comes back')
  assert.match(message, /membership/, 'say what removes it')
  assert.match(message, /by hand/, 'and say what they can still do right now')
})
