import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { THOUGHTS, thoughtForDay } from '../src/lib/daily-thought'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// It changes at midnight and not before, and it is the same line for
// everybody. Two people opening this on the same morning should be able to
// talk about it.
test('one line a day, the same one for everyone', () => {
  // Both of these are the thirteenth in London. September is British Summer
  // Time, so the second one is already the fourteenth in UTC, which is the
  // whole reason the day is worked out in London and not wherever the server
  // happens to be.
  const early = thoughtForDay(new Date('2026-09-13T00:05:00Z'))
  const late = thoughtForDay(new Date('2026-09-13T22:40:00Z'))
  assert.equal(early.text, late.text, 'the line must not change during a working day')

  // It turns over at midnight in London, not at midnight UTC.
  const justBefore = thoughtForDay(new Date('2026-09-13T22:59:00Z'))
  const justAfter = thoughtForDay(new Date('2026-09-13T23:01:00Z'))
  assert.notEqual(justBefore.text, justAfter.text, 'midnight in London is where the day turns')

  const tomorrow = thoughtForDay(new Date('2026-09-14T09:00:00Z'))
  assert.equal(justAfter.text, tomorrow.text)
  assert.notEqual(early.text, tomorrow.text)

  // A full year of mornings without seeing the same line twice.
  const seen = new Set<string>()
  for (let day = 0; day < 365; day++) {
    const date = new Date(Date.UTC(2026, 8, 13 + day, 9))
    seen.add(thoughtForDay(date).text)
  }
  assert.equal(seen.size, 365, 'the sequence repeats inside a year')
  assert.equal(THOUGHTS.length, 365, 'one for every day')
})

// A quotation on its own is decoration. The line underneath saying what to do
// about it before Friday is the reason this earns space on a working screen,
// so it is required by the type rather than left optional and forgotten.
test('every line says what to do about it', () => {
  const widget = read('src/components/DailyThought.tsx')
  assert.match(widget, /What to do with it/)
  assert.match(widget, /\{thought\.why\}/)

  for (const thought of THOUGHTS) {
    assert.ok(thought.why && thought.why.trim().length > 25,
      `no usable takeaway: ${thought.text}`)
    assert.notEqual(thought.why.trim(), thought.text.trim())
    assert.match(thought.why.trim(), /[.?]$/, `not a finished sentence: ${thought.why}`)
  }

  // Most of them should read as something to do, not something to feel.
  // This is where an attributed classic earns its keep: the quotation can be
  // two thousand years old as long as the line under it says what to do
  // before Friday.
  const instructions = THOUGHTS.filter(thought => /^[A-Z][a-z]+ (?:the|one|your|a|an|it|out|at|for|to|in|on|who|what|three|two|five|ten|each|every|down|up|somebody|yourself|them|him|her|this|that|whether|why|how|all|any|first|before|from|with|through|and|so|by)\b/.test(thought.why))
  assert.ok(instructions.length >= THOUGHTS.length * 0.6,
    `only ${instructions.length} of ${THOUGHTS.length} takeaways tell somebody what to do`)
})

// A line hung on a name the person never said is a small lie printed under
// our own logo every day.
test('nothing is left unattributed by accident', () => {
  const widget = read('src/components/DailyThought.tsx')
  assert.match(widget, /thought\.author \|\| 'Talent House Collective'/,
    'a line with no author is credited to the house, never left blank')

  for (const thought of THOUGHTS) {
    assert.ok(thought.text.trim().length > 24, `too short to be worth the space: ${thought.text}`)
    if (thought.author) {
      assert.ok(thought.author.trim().length > 2, `a name that is not a name: ${thought.author}`)
    }
  }
})

// The people this is for run departments with six-figure budgets. A poster
// quote makes a serious platform look like a wall calendar, and they read
// that instantly.
test('it is written for this industry, not for a fridge magnet', () => {
  const ours = THOUGHTS.filter(thought => !thought.author)
  assert.ok(ours.length > THOUGHTS.length / 2, 'most of these should be ours, and about spas')

  // Measured on the line itself, not on the line plus its takeaway.
  //
  // The first version of this counted a keyword anywhere in either, which
  // passed comfortably while telling nobody anything: a proxy for vocabulary
  // rather than for usefulness, and a check that quietly measures the wrong
  // thing looks exactly like a check that passes. A third of these naming
  // rotas, treatments and guests outright is the honest claim. The rest are
  // general lines, and what makes those earn their place is the instruction
  // underneath, which the next test is about.
  const industry = THOUGHTS.filter(thought =>
    /spa|therapist|treatment|guest|rota|retail|reception|facial|wellness|hotel|shift|consultation|rebook/i
      .test(thought.text))
  assert.ok(industry.length >= THOUGHTS.length / 3,
    `only ${industry.length} of ${THOUGHTS.length} lines are about the work these people actually do`)

  for (const thought of THOUGHTS) {
    assert.doesNotMatch(thought.text, /!/, `no exclamation marks: ${thought.text}`)
    assert.doesNotMatch(thought.text, /[—–]/, `no em dash: ${thought.text}`)
    assert.doesNotMatch(thought.text, /\b(passionate|dynamic|vibrant|journey|unlock|synergy|rockstar)\b/i,
      `that word is banned everywhere else on this platform: ${thought.text}`)
  }
})

// A modal on sign-in is a thing to dismiss, and by the third morning it is a
// thing to dismiss without reading.
test('it sits on the dashboard and interrupts nobody', () => {
  const widget = read('src/components/DailyThought.tsx')
  assert.doesNotMatch(widget, /fixed inset-0|role="dialog"/, 'not a modal')
  for (const page of ['src/app/talent/dashboard/page.tsx', 'src/app/employer/dashboard/page.tsx']) {
    assert.match(read(page), /<DailyThought/, `${page} has no line of the day`)
  }
  // Rendered after mount, or a page cached at eleven serves yesterday's until
  // the cache expires.
  assert.match(widget, /useEffect\(\(\) => \{ setThought\(thoughtForDay\(\)\) \}, \[\]\)/)
})
