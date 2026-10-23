import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { alertRecipients } from '../src/lib/administrators'

// A second administrator who is told nothing is not a second administrator.
//
// Every internal alert reached exactly one person. Two named a personal
// address in the source and the third read the administrator list and then
// took the oldest row with limit(1). So a business partner could be given the
// full run of the platform - every CV, the revenue, the verification queue -
// and still never learn that anybody had signed up, that a property had asked
// for a managed search, or that somebody had used the contact form.
//
// It survived an audit that checked access, because it was never an access
// problem.

const SOURCE = join(process.cwd(), 'src')

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(path, found)
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(path)
  }
  return found
}

/** The file with comments stripped, so a mention in prose is not a finding. */
function body(source: string) {
  return source
    .split('\n')
    .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

test('no internal alert is addressed to one person by name', () => {
  const offenders: string[] = []

  for (const path of sourceFiles(SOURCE)) {
    const source = body(readFileSync(path, 'utf8'))
    // The member-facing email footers carry the company's published contact
    // address on purpose. What must not come back is a personal address used
    // as the destination for an internal alert.
    if (/\bto:\s*(ADMIN_EMAIL|DEFAULT_ADMIN_EMAIL)\b/.test(source)) {
      offenders.push(path.replace(process.cwd() + '/', ''))
    }
  }

  assert.deepEqual(offenders, [], `These send an internal alert to a hardcoded address instead of administratorEmails():\n  ${offenders.join('\n  ')}`)
})

test('the three alert paths ask who the administrators are', () => {
  for (const file of [
    'src/lib/admin-alerts.ts',
    'src/app/api/contact-notify/route.ts',
    'src/app/api/employer/recruitment/route.ts',
  ]) {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    assert.match(source, /administratorEmails/, `${file} must resolve its recipients from the administrator list`)
  }
})

test('a configured inbox wins, and otherwise everybody gets it', () => {
  const admins = ['founder@example.com', 'partner@example.com']

  // An owner who typed a shared inbox into Admin Settings has said where they
  // want these to land, and that beats the list.
  assert.deepEqual(alertRecipients('team@example.com', admins), ['team@example.com'])
  assert.deepEqual(alertRecipients('  team@example.com  ', admins), ['team@example.com'])

  // Nothing configured: every administrator, founder first.
  assert.deepEqual(alertRecipients('', admins), admins)
  assert.deepEqual(alertRecipients('   ', admins), admins)

  // Nowhere to send is an empty list, never a crash and never a guess.
  assert.deepEqual(alertRecipients('', []), [])
})

test('a new administrator is told why they are on the settings page', () => {
  // The redirect appends ?security=required and nothing read it, so the first
  // thing a new admin saw was a settings page with no explanation of why they
  // were not on the dashboard.
  const page = readFileSync(join(SOURCE, 'app', 'admin', 'settings', 'page.tsx'), 'utf8')
  assert.match(page, /security'\) === 'required'/, 'the settings page must read the flag the redirect sets')
  assert.match(page, /two-step verification is not set up yet/, 'and say why the person is there')
  assert.match(page, /\/admin\/dashboard/, 'and point them at the dashboard once they are done')
})
