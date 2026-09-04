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
test('the row signals in ways the portal keeps', () => {
  const centre = read(CENTRE)
  assert.match(centre, /const tone = activityTone\(item\.type, item\.title, item\.message\)/)
  assert.match(centre, /\$\{classes\.card\}/, 'a coloured left border')
  assert.match(centre, /\$\{classes\.pill\}/, 'and a filled pill')
  // Comments stripped: the note above the icon map names the very class it is
  // avoiding, and naming it there is not using it.
  const code = centre.replace(/^\s*\/\/.*$/gm, '')
  assert.ok(!/text-amber-/.test(code), 'never amber text inside the shell')
  // Words as well as colour, for a screenshot and a colourblind reader.
  assert.equal(activityWord('action'), 'Action')
  assert.equal(activityWord('done'), 'Done')
  assert.match(toneClasses('action').pill, /bg-red-600/)
})

// An item already read is history; shouting about it is noise.
test('a read item stops shouting', () => {
  assert.match(read(CENTRE), /word && !item\.is_read &&/)
  assert.match(read(CENTRE), /item\.is_read \? 'text-muted' : TONE_ICON\[tone\]/)
})
