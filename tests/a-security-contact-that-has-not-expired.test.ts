import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// /.well-known/security.txt (RFC 9116) is where somebody who finds a hole in
// the platform looks for who to tell. It carries a date after which it is no
// longer to be trusted, so a file left alone quietly stops working. This test
// fails two months before that, while there is still time to renew it.
const file = readFileSync(join(process.cwd(), 'public/.well-known/security.txt'), 'utf8')

test('security.txt names a contact and has not nearly expired', () => {
  assert.match(file, /^Contact: mailto:security@wellnesshousecollective\.co\.uk$/m)
  const expires = Date.parse((file.match(/^Expires: (\S+)$/m) || [])[1] || '')
  assert.ok(Number.isFinite(expires), 'Expires is missing or not a date')
  assert.ok(expires - Date.now() > 60 * 24 * 3600 * 1000, 'security.txt expires within 60 days: move Expires on a year')
  assert.ok(expires - Date.now() < 366 * 24 * 3600 * 1000, 'Expires should be no more than a year away (RFC 9116)')
  assert.match(file, /^Canonical: https:\/\/talenthousecollective\.co\.uk\/\.well-known\/security\.txt$/m)
})
