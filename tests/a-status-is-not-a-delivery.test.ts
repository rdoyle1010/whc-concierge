import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const body = (file: string) =>
  readFileSync(join(process.cwd(), file), 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/admin/profile-build/route.ts')
const page = body('src/app/admin/profile-build/page.tsx')

// "Sent to them" is a status. It records that a button worked. It says
// nothing about whether an email left the building, and it was being read as
// though it did: she pressed the button, the card said sent, the recipient
// had nothing, and the only way to find out which was true was to leave the
// screen entirely.
test('the card says what has actually been sent, not what was pressed', () => {
  const get = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'))
  assert.match(get, /from\('email_log'\)/)
  assert.match(get, /\.in\('recipient', addresses\)/, 'one query for the page, not one per row')
  assert.match(get, /emails/)

  assert.match(page, /What we have sent them/)
  assert.match(page, /Nothing yet\. They have had no email from us at all\./,
    'no email at all is the answer she most needs and the easiest one to render as a blank space')
  assert.match(page, /sent\.status === 'sent' \? 'Sent' : sent\.status === 'failed' \? 'Failed' : 'Not sent'/)
  assert.match(page, /sent\.error/, 'the provider\'s own words, not a shrug')
})

// Accepted by a provider is not the same as read by a person, and saying
// "sent" without saying which is how somebody spends an evening looking for a
// bug in a junk folder.
test('sent is described honestly', () => {
  assert.match(page, /Sent means our provider accepted it/)
  assert.match(page, /junk folder/)
})

// She asked whether they have an account, which is a fair question about a
// flow that makes one silently. The screen has to answer it.
test('the screen says where the account comes from', () => {
  assert.match(page, /They already have an account/)
  assert.match(page, /made the moment they send their CV/)
  assert.match(page, /That email is the sign-up/)
})
