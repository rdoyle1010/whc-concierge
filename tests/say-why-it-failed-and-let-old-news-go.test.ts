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

test('the CV analysis has long enough to actually answer', () => {
  // A reasoning model reading eighteen thousand characters does not answer in
  // seven seconds, and the route had no maxDuration so it inherited the
  // platform default of ten. The AI half timed out almost every time.
  const route = body(CV)
  assert.match(route, /export const maxDuration = 60/,
    'the route needs a time budget larger than the model takes')
  assert.doesNotMatch(route, /abort\(\), 7000/, 'the seven-second abort was the bug')

  const timeout = /const AI_TIMEOUT_MS = (\d+)/.exec(route)
  assert.ok(timeout, 'the abort should be a named budget')
  assert.ok(Number(timeout[1]) >= 20000, 'and it should be generous enough to be reached rarely')
})

test('when the AI half does not run, it says which thing went wrong', () => {
  // "AI was unavailable" is true and tells nobody anything. It sends somebody
  // to check a key that was never the problem.
  const route = body(CV)
  for (const cause of ['No OpenAI key', 'was rejected', 'not available on this account', 'rate limited', 'did not answer within']) {
    assert.ok(route.includes(cause), `the failure "${cause}" must be named`)
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
