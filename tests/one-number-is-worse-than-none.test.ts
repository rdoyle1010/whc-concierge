import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// "1 live role, 1 approved property, 1 verified staff review" does not read as
// a young platform to somebody arriving for the first time. It reads as an
// empty one, on the pages doing the most work to persuade them otherwise.
//
// The switch existed and one page honoured it. The homepage and the
// registration page each decided for themselves, which is how a launch week
// front page came to advertise a one.

const SURFACES = [
  { file: 'src/app/page.tsx', name: 'the homepage strip' },
  { file: 'src/app/login/page.tsx', name: 'the sign-in page' },
  { file: 'src/app/register/talent/page.tsx', name: 'the registration page' },
]

test('every public surface asks the same switch before showing a count', () => {
  for (const surface of SURFACES) {
    const source = body(surface.file)
    assert.match(source, /showLiveNumbers|numbers\.show|showCounts/,
      `${surface.name} decides for itself whether a number is worth showing`)
  }
})

test('the homepage strip is off until it is turned on', () => {
  const page = body('src/app/page.tsx')
  assert.match(page, /if \(!numbers\.show\) return null/)
  // Read from the one setting, not a second copy of the idea.
  assert.match(page, /eq\('key', 'login_live_numbers'\)/)
  assert.match(page, /show: readConfigString\(setting\.data\?\.value\)\.toLowerCase\(\) === 'on'/)
})

test('the registration page is off until it is turned on', () => {
  const page = body('src/app/register/talent/page.tsx')
  assert.match(page, /const showCounts = stats\?\.showLiveNumbers === true/)
  assert.match(page, /showCounts && stats\?\.liveRoles/)
  assert.match(page, /showCounts && stats\?\.properties/)
})

// The promises are true on day one and on day one thousand, so they are not
// governed by a count that is not yet worth quoting.
test('the standing promises are not hidden along with the numbers', () => {
  const page = body('src/app/register/talent/page.tsx')
  assert.match(page, /Salary expectations stay private until you choose/)
  assert.match(page, /Verified employers only/)
  const promises = page.slice(page.indexOf('Salary expectations stay private'))
  assert.doesNotMatch(promises.slice(0, 200), /showCounts/)
})

// One switch, and it says what it actually governs.
test('the setting no longer claims to control one page', () => {
  const settings = body('src/app/admin/settings/page.tsx')
  const label = (settings.match(/key: 'login_live_numbers', label: '([^']*)'/) || [])[1] || ''
  assert.ok(label, 'the setting has moved')
  assert.match(label, /homepage/i)
  assert.match(label, /registration/i)
})
