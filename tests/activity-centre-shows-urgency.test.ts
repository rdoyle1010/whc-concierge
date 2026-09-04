import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { activityTone, activityWord } from '../src/lib/activity-tone.ts'
import { toneClasses } from '../src/lib/status-tone.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const CENTRE = 'src/components/DashboardActivityCentre.tsx'

// Every row in the Activity Centre rendered as the same grey bell. A
// counter-offer that expires in four hours, an insurance certificate lapsing
// tomorrow and a badge being awarded all looked identical, so the list said
// there were eight things and nothing about which one mattered.
test('the things somebody is waiting on read as action', () => {
  for (const title of [
    'Counter-offer received',
    'New agency offer',
    'URGENT: shift offer for today',
    'Your insurance expires soon',
    'Your featured profile expires soon',
    'Job offer - Director of Spa',
    'New interview times requested - Spa Therapist',
    'Interview 1 details changed - Spa Therapist',
    'Reference request',
    'Agency shift issue raised',
    'Agency shift cancelled',
    'Complete your Property Fact File',
    'How was your shift?',
  ]) {
    assert.equal(activityTone('general', title), 'action', `${title} needs the reader to do something`)
  }
})

// A good word inside a negation is not good news.
test('a negation is not read as an approval', () => {
  assert.equal(activityTone('general', 'Consultancy listing not approved'), 'action')
  assert.equal(activityTone('general', 'Urgent cover not filled'), 'action')
  assert.equal(activityTone('general', 'Certificate withdrawn'), 'action')
  assert.equal(activityTone('general', 'Talent House Verified badge paused'), 'action')
  // And the positives still are.
  assert.equal(activityTone('general', 'Consultancy listing approved'), 'done')
  assert.equal(activityTone('general', 'Right to work verified'), 'done')
})

test('a good outcome is green and a message is amber', () => {
  for (const title of [
    'Right to work verified',
    'Certificate awarded',
    'Congratulations - you have been hired',
    'Booking confirmed - payment received',
    'Your Before You Arrive pack is ready',
    'Course complete - certificate earned',
    'Your paid roles are now live',
  ]) {
    assert.equal(activityTone('general', title), 'done', `${title} is finished`)
  }
  assert.equal(activityTone('new_message', 'New message from Wellness House Collective LTD'), 'waiting')
  assert.equal(activityTone('general', 'Verification submitted'), 'waiting')
})

// Sixty-three of the seventy-one notifications this platform sends are typed
// 'general', so the type could never have answered the question.
test('classification does not depend on a type that is always the same', () => {
  assert.equal(activityTone('general', 'URGENT: shift offer for today'), 'action')
  assert.equal(activityTone('', 'URGENT: shift offer for today'), 'action')
  // Nothing recognisable stays out of the way rather than guessing.
  assert.equal(activityTone('general', 'A note about something'), 'quiet')
  assert.equal(activityWord('quiet'), '')
})

// The portal repaints text-amber-* grey, so urgency cannot ride on amber text.
test('the screen signals in ways the portal keeps', () => {
  const centre = read(CENTRE)
  assert.match(centre, /\$\{tile\.card\}/, 'a coloured left border on the live tiles')
  assert.match(centre, /\$\{tile\.pill\}/, 'and a filled pill')
  // Comments stripped: the note above the icon map names the very class it is
  // avoiding, and naming it there is not using it.
  const code = centre.replace(/^\s*\/\/.*$/gm, '')
  assert.ok(!/text-amber-/.test(code), 'never amber text inside the shell')
  // Words as well as colour, for a screenshot and a colourblind reader.
  assert.equal(activityWord('action'), 'Action')
  assert.equal(activityWord('done'), 'Done')
  assert.match(toneClasses('action').pill, /bg-red-600/)
})

// "You are up to date" sat directly above three rows shouting ACTION at things
// that had already been dealt with. A log entry records what happened; it is
// not a demand, and the block above it is the one that knows what is still
// outstanding.
test('recent activity records rather than demands', () => {
  const centre = read(CENTRE)
  const log = centre.slice(centre.indexOf('Recent activity'))
  assert.ok(!/activityWord\(tone\)/.test(log), 'no action pill on a historical row')
  assert.match(log, /const tone = activityTone/, 'the tone still tints the row for scanning')
  assert.match(centre, /item\.is_read \? 'text-muted' : TONE_ICON\[tone\]/, 'and a read item fades')
})

// An Agency offer is the most time-critical thing on this platform - an urgent
// one expires in four hours - and the attention block had never heard of it.
// So somebody with a counter-offer waiting was told they were up to date.
test('the block that claims to know what needs you knows about agency offers', () => {
  const api = read('src/app/api/dashboard/activity/route.ts')
  assert.match(api, /Agency shift offers to answer/)
  assert.match(api, /\.eq\('candidate_id', candidate\.id\)\.eq\('status', 'pending'\)/, 'pending is the professional’s move')
  assert.match(api, /Counter-offers to answer/)
  assert.match(api, /\.eq\('employer_id', employer\.id\)\.eq\('status', 'countered'\)/, 'countered hands it back to the property')
})

// violet, gold and blue were decorative names the dashboard ignored, which is
// part of why nothing on that screen ever looked urgent.
test('the attention tones are the platform’s own vocabulary', () => {
  const api = read('src/app/api/dashboard/activity/route.ts')
  assert.ok(!/tone: 'violet'|tone: 'gold'|tone: 'blue'/.test(api))
  assert.match(api, /tone: 'action' \| 'waiting' \| 'done'/)
  assert.match(read(CENTRE), /toneClasses\(item\.tone\)/, 'and the tiles actually use them')
})
