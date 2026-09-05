import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function sourceFiles(root: string): string[] {
  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|mts)$/.test(entry)) found.push(full)
    }
  }
  walk(root)
  return found
}

const CANONICAL = 'src/lib/send-email.ts'

test('one file decides what address the platform sends from', () => {
  // It was written out by hand in seventeen files. Changing the brand meant
  // editing all seventeen, and the one somebody missed would keep sending
  // from the old domain for months, because a wrong From address does not
  // fail. It arrives, looking like a different company.
  const offenders: string[] = []
  for (const file of [...sourceFiles('src'), ...sourceFiles('netlify')]) {
    if (file === CANONICAL) continue
    const source = readFileSync(file, 'utf8')
    if (/noreply@[a-z0-9.-]+/i.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [],
    `these carry their own sending address: ${offenders.join(', ')}`)
})

test('the address is on the domain the brand actually uses', () => {
  const source = readFileSync(CANONICAL, 'utf8')
  assert.match(source, /noreply@mail\.talenthousecollective\.co\.uk/,
    'somebody who signed up to Talent House should hear from Talent House')
})

test('a broken sending domain can be fixed without a deploy', () => {
  // Resend verifies domains, not brand names, and an unverified domain is
  // rejected outright. If this address ever stops being verified, every
  // email on the platform stops, and waiting on a developer is the wrong
  // answer to that.
  const source = readFileSync(CANONICAL, 'utf8')
  assert.match(source, /process\.env\.EMAIL_FROM/,
    'the sending address must be overridable from the environment')
})
