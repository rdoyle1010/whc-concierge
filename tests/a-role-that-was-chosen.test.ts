import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/interview-ready/route.ts')
const mobile = body('src/app/api/mobile/interview-ready/route.ts')

test('a role and its property are read separately', () => {
  // One query with employer_profiles(*) embedded in it. That table has row
  // level security a talent user does not satisfy, so the embed failed and
  // took the role down with it: the page said "Selected: Director of Spa"
  // and the answer was "Choose a role or enter a target role".
  assert.doesNotMatch(route, /employer_profiles\(\*\)/, 'the embed is what broke it')
  assert.match(route, /from\('job_listings'\)\s*\n?\s*\.select\('\*'\)/,
    'every column of the role, because the dossier reads six of them')
  assert.match(route, /from\('employer_profiles'\)\.select\('\*'\)\.eq\('id', job\.employer_id\)/)
})

test('a property nobody can read thins the dossier, it does not stop it', () => {
  // companyFacts already names what is missing rather than inventing it, so
  // an unreadable property produces a dossier with its gaps stated. That was
  // the designed behaviour and the embed was overriding it.
  const lookup = route.slice(route.indexOf("const jobId ="), route.indexOf('const style ='))
  assert.match(lookup, /employer = property \|\| null/)
  assert.doesNotMatch(lookup, /if \(propertyError\) return/, 'a missing property is never fatal')
})

test('somebody who chose a role is never told to choose a role', () => {
  // The specific insult: the form says Selected, and the answer says choose
  // one. Whatever went wrong, it was not that.
  assert.match(route, /if \(!job && jobId\)/, 'the case where a role was chosen and not found')
  assert.match(route, /That role is no longer listed/)
  assert.match(route, /We could not read that role just now/)
  assert.match(route, /jobLookupFailed/, 'a failed read and an absent role are different facts')

  // And the original message survives for the case it was written for.
  assert.match(route, /if \(!job && !customRole\) return[\s\S]{0,120}Choose a role or enter a target role/)
  assert.ok(route.indexOf('if (!job && jobId)') < route.indexOf('Choose a role or enter a target role'),
    'the specific answer has to come before the general one')
})

test('the app had the same query and therefore the same bug', () => {
  // Copied, so it broke in the same place and said something different about
  // it: on the phone a chosen role came back "This role is no longer
  // available" while it sat on the board.
  assert.doesNotMatch(mobile, /employer_profiles\(\*\)/)
  assert.match(mobile, /from\('employer_profiles'\)\.select\('\*'\)\.eq\('id', job\.employer_id\)/)
  assert.match(mobile, /employer = property \|\| null/)
})

test('a credit is spent by the server, not by the account spending it', () => {
  // The update ran on the user's own client, and a talent account cannot
  // write its own credit balance: row level security forbids it, correctly,
  // because a column somebody can set for themselves is not an allowance. So
  // the spend failed and returned "we could not confirm your allowance" to
  // somebody the sidebar was telling had one credit left.
  for (const [name, source] of [['website', route], ['app', mobile]] as const) {
    const spend = source.slice(source.indexOf('const nextCredits = credits - 1'))
    assert.match(spend, /createAdminClient\(\)/, `the ${name} still spends on the user's client`)
    // Still their own row, and still atomic. The service role makes the write
    // possible; it must not make it careless.
    assert.match(spend, /\.eq\('id', candidate\.id\)/, `the ${name} must touch only that profile`)
    assert.match(spend, /\.eq\('interview_ready_credits', credits\)/,
      `the ${name} lost its compare-and-set, so two requests can spend one credit twice`)
  }
})

test('nothing else lets an account write its own allowance', () => {
  // The service role is used here because the column is a paid entitlement.
  // That reasoning only holds while it is the only place writing it.
  const writes = ['src/app/api/interview-ready/route.ts', 'src/app/api/mobile/interview-ready/route.ts']
  for (const file of writes) {
    const source = body(file)
    const updates = source.match(/\.update\(\{ interview_ready_credits/g) || []
    assert.equal(updates.length, 1, `${file} writes the balance in more than one place`)
  }
})
