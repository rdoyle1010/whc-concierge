import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// There was nowhere for an administrator to change her own password.
//
// The only password forms on the platform are on the talent and employer
// settings pages. An admin can reach both, so the answer to "where do I change
// my password" was "open the candidate settings page and ignore Stealth Mode,
// Job Alerts and the agency toggles, none of which apply to you".

test('the admin area has a password form of its own', () => {
  const settings = read('src/app/admin/settings/page.tsx')
  assert.match(settings, /AdminPasswordPanel/, 'admin settings must carry the panel')
  assert.match(settings, /import AdminPasswordPanel/, 'and actually import it')
})

test('verifying the current password does not cost an administrator her second factor', () => {
  // signInWithPassword on the shared browser client replaces the live session
  // with a fresh one at assurance level one. An administrator who has just
  // cleared level two would be downgraded and bounced to the authenticator
  // challenge as a reward for being careful, so the check runs on a throwaway
  // client that persists nothing.
  const panel = read('src/components/AdminPasswordPanel.tsx')
  assert.match(panel, /persistSession: false/, 'the verification client must not persist a session')
  assert.match(panel, /autoRefreshToken: false/, 'nor refresh one')
  assert.match(panel, /createIsolatedClient/, 'and must be separate from the shared browser client')

  // The shared client is still what actually sets the new password, because
  // that is the session the change belongs to.
  assert.match(panel, /supabase\.auth\.updateUser\(\{ password: next \}\)/)
})

test('an admin password has a floor worth the access behind it', () => {
  const panel = read('src/components/AdminPasswordPanel.tsx')
  assert.match(panel, /next\.length < 12/, 'twelve characters, not the eight a member gets')
  assert.match(panel, /next === current/, 'and it has to actually change')
})
