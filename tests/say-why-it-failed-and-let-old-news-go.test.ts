import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const CV = 'src/app/api/cv/analyse/route.ts'

test('the CV analysis fits inside the time it is actually given', () => {
  // Asking for more than the host allows is not a budget, it is a wish. This
  // route had no maxDuration at all and timed out at ten seconds; then it
  // asked for sixty, which the host caps at twenty-six, and gave the model
  // forty-five inside that. Both versions could not finish in principle, and
  // both read on screen as "AI was unavailable".
  const route = body(CV)
  const declared = Number(/export const maxDuration = (\d+)/.exec(route)?.[1])
  assert.ok(declared > 0, 'the route must name its own budget rather than inherit ten seconds')
  assert.ok(declared <= 26, `maxDuration ${declared} is above the twenty-six the host enforces`)
  assert.doesNotMatch(route, /abort\(\), 7000/, 'the seven-second abort was the original bug')

  // And the model's own budget has to leave room to answer inside that.
  const reader = body('src/lib/cv-read.ts')
  const call = Number(/const CALL_TIMEOUT_MS = (\d+)/.exec(reader)?.[1])
  assert.ok(call >= 10000, 'generous enough to be reached rarely')
  assert.ok(call <= (declared - 6) * 1000, 'and short enough that a refusal can still be written')
})

test('when the AI half does not run, it says which thing went wrong', () => {
  // "AI was unavailable" is true and tells nobody anything. It sends somebody
  // to check a key that was never the problem.
  const route = body(CV)
  assert.match(route, /lastAiFailure = result\.error/, 'the reader\'s own reason is kept, not flattened')
  assert.match(route, /is not switched on for this deployment/)

  // The reasons themselves live with the reader, which is the only thing that
  // knows which of them happened.
  const reader = body('src/lib/cv-read.ts')
  for (const cause of ['is not set on this deployment', 'was refused', 'Too many CVs at once', 'took too long to read']) {
    assert.ok(reader.includes(cause), `the failure "${cause}" must be named`)
  }

  assert.match(route, /aiFailure: suggestions\.aiEnhanced \? null/,
    'the reason must travel back with the answer')

  const page = body('src/app/talent/profile/page.tsx')
  assert.doesNotMatch(page, /AI was unavailable, so no AI inference was used/,
    'the screen should carry the reason, not the shrug')
  assert.match(page, /cvAiFailure/, 'and it must render it')
})

test('recent activity stops being recent eventually', () => {
  // It took the last eight notifications with no age limit, so an urgent
  // shift offer from a fortnight ago sat on the dashboard until eight newer
  // things pushed it off. On a quiet account that is never.
  const route = body('src/app/api/dashboard/activity/route.ts')
  assert.match(route, /ACTIVITY_WINDOW_DAYS = 14/)
  assert.match(route, /\.gte\('created_at', ACTIVITY_SINCE\(\)\)/,
    'the query must actually apply the window')
})
