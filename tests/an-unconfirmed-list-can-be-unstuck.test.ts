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

test('somebody stuck at pending can ask for the email again', () => {
  // The button was disabled at "pending" and read "Confirmation email sent",
  // so anybody whose confirmation never arrived was stuck there for good -
  // and that is where the largest part of a marketing list quietly sits.
  const component = body('src/components/PrivacyPreferences.tsx')
  assert.doesNotMatch(component, /disabled=\{saving \|\| marketingPending\}/,
    'the opt-in button must stay usable while a confirmation is outstanding')
  assert.match(component, /Send the confirmation email again/,
    'the button should say what it now does')
})

test('asking again is rate limited, and never re-asks somebody who already said yes', () => {
  const route = body('src/app/api/privacy/marketing/request/route.ts')
  assert.match(route, /RESEND_COOLDOWN_SECONDS/, 'an enabled button needs a cooldown')
  assert.match(route, /status: 429/, 'too soon must be refused, not silently resent')
  assert.match(route, /=== 'confirmed'/,
    'somebody already confirmed must not be dropped back to pending by pressing it')
  // Consent history has to show which of the two happened.
  assert.match(route, /'requested_again'/, 'a resend must be distinguishable in the consent log')
})

test('an administrator can prove whether email reaches a member', () => {
  // The alternative was deleting somebody's account and asking them to sign
  // up again, which destroys a profile, a CV and a right-to-work document to
  // test a mail server.
  const route = body('src/app/api/admin/users/route.ts')
  assert.match(route, /action === 'reachability_check'/)
  assert.match(route, /getUserById/, 'the address comes from the account, not from a form')
  assert.match(route, /sendTransactionalEmail/, 'it must send a real email down the real path')
  assert.match(route, /userId,/, 'the send must be attributed so it lands in that member’s email log')

  const page = body('src/app/admin/users/page.tsx')
  assert.match(page, /reachability_check/, 'the admin drawer needs the button')
})
