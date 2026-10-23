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

const FORMS = ['src/app/register/talent/page.tsx', 'src/app/register/employer/page.tsx']

test('registration asks about marketing, because nowhere else did', () => {
  // The opt-in lived only on the Privacy & Preferences page, inside account
  // settings. Six of the first eight members had never opted in and not one
  // had declined - nobody had ever asked them.
  for (const form of FORMS) {
    const source = body(form)
    assert.match(source, /MARKETING_CONSENT_WORDING/,
      `${form} must show the same wording that gets recorded against the account`)
    assert.match(source, /marketingOptIn,/, `${form} must send the answer with the registration`)
  }
})

test('the box starts unticked and is not bundled with the terms', () => {
  for (const form of FORMS) {
    const source = body(form)
    // A pre-ticked box is not consent under the UK GDPR.
    assert.match(source, /useState\(false\)\n?.*|const \[marketingOptIn, setMarketingOptIn\] = useState\(false\)/,
      `${form} must default the marketing box to off`)
    assert.match(source, /const \[marketingOptIn, setMarketingOptIn\] = useState\(false\)/,
      `${form} must default the marketing box to off`)
  }
  // Agreeing to the terms must not be what opts somebody into marketing.
  const employer = body('src/app/register/employer/page.tsx')
  assert.doesNotMatch(employer, /agreed_terms.*setMarketingOptIn|setMarketingOptIn.*agreed_terms/,
    'marketing consent must be its own decision, not part of accepting the terms')
})

test('ticking it starts a real double opt-in, and never blocks the account', () => {
  const route = body('src/app/api/register/init/route.ts')
  assert.match(route, /body\.marketingOptIn === true/, 'only a literal true counts as consent')
  assert.match(route, /startMarketingOptIn\(/, 'it must go through the same double opt-in as everywhere else')
  assert.match(route, /catch \(optInError/, 'a failed marketing email must not cost somebody their account')

  const helper = body('src/lib/privacy-consent.ts')
  assert.match(helper, /marketing_email_status: 'pending'/,
    'ticking a box is a request, not a confirmation - it stays off until they click the link')
  assert.match(helper, /wording: MARKETING_CONSENT_WORDING/,
    'the consent record must store the wording they were actually shown')
  assert.match(helper, /source,/, 'the record must say where they were asked')
})
