import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const brief = read('docs/project-brief.md')

// The brief is pasted into an assistant that cannot see the code. Everything
// it says is believed, so what it says has to be true, and what it must never
// say has to stay out.

// Fourteen real people trusted us with their careers. Describing the shape of
// a problem is fine; naming the people in it is not.
test('the brief names no person on the register and no secret', () => {
  // The addresses that have appeared in this project's admin screens.
  assert.doesNotMatch(brief, /@gmail\.com|@outlook\.com|@aol\.com|@live\.co\.uk/i)
  // Any address at all, other than the platform's own domain.
  const addresses = (brief.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [])
    .filter(address => !address.endsWith('talenthousecollective.co.uk'))
  assert.deepEqual(addresses, [], `the brief carries an address: ${addresses.join(', ')}`)
  // Keys, tokens and connection strings.
  assert.doesNotMatch(brief, /sk_live|sk_test|eyJ[A-Za-z0-9_-]{20,}|SERVICE_ROLE_KEY\s*=|postgres:\/\//)
  // And it says so itself, so the rule travels with the file.
  assert.match(brief, /never goes into an outside chat/i)
})

// The two things the market told us, which any advice has to respect.
test('the brief carries the feedback that changed the product', () => {
  assert.match(brief, /private by default/i)
  assert.match(brief, /Discreet/)
  assert.match(brief, /five per cent/i, 'the point that most professionals are not looking')
  assert.match(brief, /empty marketplace cannot be launched/i)
})

// An assistant that thinks there are a thousand users gives advice for a
// business that does not exist.
test('the brief is honest about the size of the thing', () => {
  assert.match(brief, /\| Talent on the register \| 14 \|/)
  assert.match(brief, /\| Completed profiles \| 0 \|/)
  assert.match(brief, /\| Revenue \| £0 \|/)
})

// The rules that get broken first when somebody else is writing the copy.
test('the brief carries the house rules', () => {
  assert.match(brief, /British English/)
  assert.match(brief, /No em dashes/i)
  assert.match(brief, /Secrets live only in Netlify/i)
  assert.match(brief, /mutation tested/i)
})

// Two assistants writing to the same branch produce conflicting changes and
// broken tests, and neither can see what the other did.
test('the brief says plainly that only one of them touches the code', () => {
  assert.match(brief, /cannot talk to each other/i)
  assert.match(brief, /Do not let both edit the repository/i)
  assert.match(brief, /check.{0,40}against what the code actually does/i)
})

// The em-dash rule applies to the brief itself, or it is being taught by
// counterexample. The readiness check only sweeps src/.
test('the brief obeys the rule it states', () => {
  assert.doesNotMatch(brief, /—/, 'the brief contains an em dash')
})

// A brief nobody is obliged to update is a brief that rots.
test('the obligation to keep it current is written where the builder reads it', () => {
  const claude = read('CLAUDE.md')
  assert.match(claude, /docs\/project-brief\.md/)
  assert.match(claude, /Keep it current/i)
  assert.match(claude, /worse than none/i)
})

// The figures in the brief are the ones most likely to go stale, so the
// counts it quotes about the codebase have to be roughly true today. Not
// exact: a brief that fails on one new route is a brief nobody maintains.
test('the counts it quotes are still in the right region', () => {
  const routes = countFiles('src/app/api', 'route.ts')
  const tests = readdirSync(join(process.cwd(), 'tests')).filter(name => name.endsWith('.test.ts')).length
  const claimedRoutes = Number((brief.match(/(\d+) API routes/) || [])[1])
  const claimedTests = Number((brief.match(/(\d+) test files/) || [])[1])
  assert.ok(Math.abs(routes - claimedRoutes) <= 25, `brief says ${claimedRoutes} routes, there are ${routes}`)
  assert.ok(Math.abs(tests - claimedTests) <= 15, `brief says ${claimedTests} test files, there are ${tests}`)
})

function countFiles(dir: string, name: string): number {
  let total = 0
  for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFiles(`${dir}/${entry.name}`, name)
    else if (entry.name === name) total++
  }
  return total
}
