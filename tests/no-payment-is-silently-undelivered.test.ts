import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const FULFILMENT = 'src/lib/stripe-checkout-fulfilment.ts'

function body(path: string) {
  // Comments in this file quote the code they explain, so an assertion read
  // against the raw text can pass on a sentence rather than a statement.
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('every fulfilment branch records that it delivered something', () => {
  const source = body(FULFILMENT)
  const lines = source.split('\n')
  const branches = lines
    .map((line, index) => ({ line, index }))
    .filter(entry => /^ {2}if \(meta\?\.type === /.test(entry.line))

  assert.ok(branches.length >= 13, `expected the fulfilment branches to still be here, found ${branches.length}`)

  for (const branch of branches) {
    const name = /'([a-z_]+)'/.exec(branch.line)?.[1] || branch.line.trim()
    const next = lines[branch.index + 1] || ''
    assert.equal(
      next.trim(),
      'delivered = true',
      `the "${name}" branch does not record that it delivered anything, so an unmatched payment would look identical to a delivered one`,
    )
  }
})

test('a paid checkout that matched nothing raises the alarm instead of returning ok', () => {
  const source = body(FULFILMENT)

  assert.match(source, /let delivered = false/)
  assert.match(
    source,
    /if \(!delivered\) return await nothingWasDelivered\(session, meta\)/,
    'the fulfilment function must not end with a bare success when nothing matched',
  )

  // The alarm itself has to reach a person, not just a log line.
  const alarm = source.slice(source.indexOf('async function nothingWasDelivered'))
  assert.match(alarm, /notifyAdmins\(/, 'an undelivered payment must notify an administrator')
  assert.match(alarm, /session\.mode === 'subscription'/, 'subscriptions are delivered by invoice events and must not raise a false alarm')
  assert.match(alarm, /payment_status !== 'paid'/, 'an unpaid session has taken no money and must not raise a false alarm')
  assert.match(alarm, /DELIVERED_ELSEWHERE/, 'Residency checkouts are fulfilled on their own path and must not raise a false alarm')
})

test('the Residency types the webhook intercepts are the ones excused here', () => {
  const source = body(FULFILMENT)
  const set = /const DELIVERED_ELSEWHERE = new Set\(\[([^\]]*)\]\)/.exec(source)
  assert.ok(set, 'DELIVERED_ELSEWHERE must be declared')
  const excused = Array.from(set[1].matchAll(/'([a-z_]+)'/g)).map(m => m[1]).sort()

  const residency = body('src/lib/residency-stripe-webhook.ts')
  const intercepted = Array.from(
    residency.matchAll(/session\.metadata\?\.type === '([a-z_]+)'/g),
  ).map(m => m[1]).sort()

  assert.deepEqual(
    excused,
    Array.from(new Set(intercepted)).sort(),
    'a type excused from the alarm must actually be delivered by the Residency handler',
  )
})
