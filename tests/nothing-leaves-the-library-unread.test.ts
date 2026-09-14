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

const route = body('src/app/api/admin/documents/route.ts')
const page = body('src/app/admin/documents/page.tsx')
const migration = read('supabase/migrations/20260914090000_documents_she_has_signed_off.sql')
const shell = read('src/components/DashboardShell.tsx')

// A generated document reaching a client without a person reading it is the
// worst thing this platform could do, and it would be found out later by
// somebody else in front of an assessor.
test('a document is draft until somebody has read it', () => {
  assert.match(migration, /status text not null default 'draft'/)
  assert.match(migration, /check \(status in \('draft','approved','retired'\)\)/)
  assert.match(route, /action === 'approve'/)
  assert.match(page, /Sign it off/)
  assert.match(page, /Nothing reaches a property until you have/)
})

// An approval is a statement that somebody read a finished document. Signing
// off a half-finished one is exactly the failure this flow exists to prevent,
// so the server refuses rather than the button merely being greyed out.
test('an unfinished document cannot be signed off', () => {
  const approve = route.slice(route.indexOf("action === 'approve'"), route.indexOf("action === 'unapprove'"))
  assert.match(approve, /missingFromSop/)
  assert.match(approve, /Not ready to sign off/)
  assert.match(approve, /status: 400/)

  // Refused on the server, not only disabled on the screen. A disabled button
  // is a suggestion.
  assert.ok(approve.indexOf('missing.length') < approve.indexOf("status: 'approved'"),
    'the check has to come before the write')

  // And the reference has to be in the house format, because it is what a
  // client files the document under and what other documents point at.
  assert.match(approve, /isValidReference\(row\.reference\)/)
})

// Approving version one says nothing about version four.
test('an approval is tied to the version it was given for', () => {
  assert.match(migration, /approved_version text/)
  assert.match(route, /approved_version: row\.version/)
  assert.match(route, /stale: row\.status === 'approved' && row\.approved_version !== row\.version/)
  assert.match(page, /Read it again/, 'and the screen says so rather than showing a green tick')
})

// A stale approval left on screen is worse than none, so taking one back
// clears it rather than greying it out.
test('taking a sign-off back removes it', () => {
  const undo = route.slice(route.indexOf("action === 'unapprove'"))
  for (const field of ['approved_by: null', 'approved_by_name: null', 'approved_at: null', 'approved_version: null']) {
    assert.ok(undo.includes(field), `${field} must be cleared`)
  }
})

// Every write here is behind the same admin check as the rest of the platform.
test('the library is admin only', () => {
  const post = route.slice(route.indexOf('export async function POST'))
  assert.ok(post.indexOf('adminRequestUser()') < post.indexOf("action === 'approve'"))
  assert.match(route, /export async function GET\(\) \{\s*const actor = await adminRequestUser\(\)/)
  assert.match(migration, /revoke all on table public\.operational_documents from anon, authenticated/)
})

// One column rather than thirty, because Postgres refuses a whole statement
// over one unknown column name and this platform has paid for that.
test('the document is one validated column', () => {
  assert.match(migration, /document jsonb not null/)
  assert.match(migration, /reference text not null unique/,
    'two documents sharing a reference is a filing system that has stopped working')
})

// She has to be able to find it.
test('it has a way in', () => {
  assert.match(shell, /href: '\/admin\/documents'/)
  assert.match(shell, /label: 'Standards'/)
})
