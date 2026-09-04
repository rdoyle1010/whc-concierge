import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The sign-in address was fixed at registration and nothing on the platform
// could change it. People change jobs, leave agencies and lose inboxes; the
// only route back was to register again and abandon the profile, the
// applications and the Academy record attached to the old account.
test('a member can change the address they sign in with', () => {
  const panel = read('src/components/EmailAddressPanel.tsx')
  assert.match(panel, /updateUser\(\{ email/, 'the change goes through Supabase, which confirms the new inbox')
  for (const page of ['src/app/talent/settings/page.tsx', 'src/app/employer/settings/page.tsx']) {
    assert.match(read(page), /<EmailAddressPanel \/>/, `${page} must offer it`)
  }
})

// Supabase changes the address on any live session. Without a password the
// takeover is silent as well as easy: the confirmation goes to the new inbox,
// which by then belongs to whoever found the unlocked laptop.
test('changing the address requires the current password', () => {
  const panel = read('src/components/EmailAddressPanel.tsx')
  const reauth = panel.indexOf('signInWithPassword')
  const change = panel.indexOf('updateUser({ email')
  assert.ok(reauth !== -1, 'the person must re-prove who they are')
  assert.ok(reauth < change, 'and before the address is changed, not after')
})

// A typo in the new address, applied immediately, locks somebody out for good.
test('nothing changes until the new inbox is proved', () => {
  const panel = read('src/components/EmailAddressPanel.tsx')
  assert.match(panel, /Nothing changes until you do/, 'the person is told the change is not live yet')
  assert.match(panel, /new_email/, 'and a change already in flight is shown rather than hidden')
})

// profiles.email and employer_profiles.email are what the admin lists,
// invoices and contact routes read. A confirmed change updates auth.users and
// leaves both holding an address the person no longer has.
test('a confirmed change reaches the copies of the address we keep', () => {
  const route = read('src/app/api/auth/login/route.ts')
  assert.match(route, /async function syncStoredEmail/)
  assert.match(route, /profile\.email !== authData\.user\.email/, 'reconciled where the current address has just been proved')
  for (const table of ['profiles', 'employer_profiles']) {
    assert.ok(route.includes(`from('${table}').update({ email })`), `${table} must be brought up to date`)
  }
})
