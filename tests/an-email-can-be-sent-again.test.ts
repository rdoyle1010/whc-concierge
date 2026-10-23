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

const ROUTE = 'src/app/api/admin/users/route.ts'

test('the emails people chase can be sent again', () => {
  const route = body(ROUTE)
  assert.match(route, /action === 'resend'/)
  for (const template of ['welcome', 'approval', 'marketing_confirmation', 'sign_in_link']) {
    assert.ok(route.includes(`'${template}'`), `${template} must be resendable`)
  }
  // The address comes from the account. A form field would be a way to send
  // somebody else's welcome email to an address of your choosing.
  assert.match(route, /getUserById\(userId\)/)
})

test('resending never says something untrue', () => {
  const route = body(ROUTE)

  // Telling somebody they are approved when they are not is worse than
  // sending nothing.
  assert.match(route, /if \(!approved\) return NextResponse\.json/,
    'the approval email must be refused for an unapproved account')

  // Re-sending a confirmation to somebody who already confirmed would drop
  // them back to pending and quietly shrink the mailable list.
  assert.match(route, /marketing_email_status === 'confirmed'/,
    'an already-confirmed person must not be knocked back to pending')
  assert.match(route, /marketing_email_status === 'unsubscribed'/,
    'somebody who unsubscribed must not be re-asked on their behalf')
})

test('interview and offer emails stay with the application', () => {
  // They belong to one application at one moment. Resending a two-month-old
  // offer raises a real question about which offer is live.
  const route = body(ROUTE)
  const resendBlock = route.slice(route.indexOf("action === 'resend'"), route.indexOf("action === 'reachability_check'"))
  assert.doesNotMatch(resendBlock, /sendOfferEmail|sendInterview/,
    'offers and interviews must not be resendable from the user drawer')

  const page = body('src/app/admin/users/page.tsx')
  assert.match(page, /Interview invitations and offers are sent from the application/,
    'the screen should say where those live instead')
})
