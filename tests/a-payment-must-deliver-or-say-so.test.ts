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

// A fulfilment branch that discards its write error reports success while
// delivering nothing: the webhook answers 200, Stripe marks the payment
// fulfilled and never retries, and nobody is told. This was fixed for the
// guest course purchase and left in place in six other paid branches.

test('every paid fulfilment branch checks the write that delivers it', () => {
  const source = read('src/lib/stripe-checkout-fulfilment.ts')
  const unchecked = source.split('\n')
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) =>
      /^await supabase\.from\(/.test(line)
      && /\.(update|upsert|insert)\(/.test(line)
    )
  assert.deepEqual(unchecked.map(u => u.number), [],
    `these writes discard their error, so a failure would report success: lines ${unchecked.map(u => u.number).join(', ')}`)
})

test('a course, a bundle, a listing and a subscription all ask Stripe to retry', () => {
  const source = body('src/lib/stripe-checkout-fulfilment.ts')
  for (const message of ['course fulfilment failed', 'course_bundle fulfilment failed',
                         'agency_listing fulfilment failed', 'employer_registration fulfilment failed',
                         'agency_plus fulfilment failed']) {
    assert.ok(source.includes(message), `${message} must be reachable`)
  }
})

// The one write that publishes a paid advert discarded its error, and the
// caller discarded the result, so both halves had to be wrong for the property
// to be told "the role is now live" about an advert that did not exist.
test('a paid advert that fails to publish is not reported as live', () => {
  const publish = body('src/lib/job-posting-fulfilment.ts')
  assert.match(publish, /const \{ error: publishError \}/, 'the publishing write must be checked')
  assert.match(publish, /if \(publishError\)/)

  const caller = body('src/lib/stripe-checkout-fulfilment.ts')
  assert.match(caller, /const published = await publishPaidJobPosting/,
    'discarding the result made the check pointless')
  assert.match(caller, /if \(!published\.ok\)/)
  assert.match(caller, /notifyAdmins\(\s*'A job advert was paid for and not published'/)
})

// Talent memberships carry type 'commercial_product' and write
// stripe_customer_id onto the candidate row. The fall-through branch matched
// on that column alone, so every member was granted the Featured Talent
// placement free and it was re-extended on every subscription event.
test('a subscription only grants the product it was bought for', () => {
  const webhook = body('src/app/api/stripe/webhook/route.ts')
  const updated = webhook.slice(webhook.indexOf("case 'customer.subscription.updated'"),
                                webhook.indexOf("case 'customer.subscription.deleted'"))
  assert.match(updated, /if \(subType === 'featured_profile'\)/,
    'the featured branch must name its type like the five above it')
  assert.doesNotMatch(updated, /is_featured: true,\s*featured_until: subscriptionPeriodEnd\(subscription, 30\),\s*\}\)\.eq\('stripe_customer_id'/,
    'granting on customer id alone is what gave every member a paid placement')
})

test('one product failing does not cancel another', () => {
  const webhook = body('src/app/api/stripe/webhook/route.ts')
  const failed = webhook.slice(webhook.indexOf("case 'invoice.payment_failed'"),
                               webhook.indexOf("case 'customer.subscription.updated'"))
  assert.doesNotMatch(failed, /is_featured: false/,
    'a membership card decline must not destroy a separately bought Featured placement')
  assert.doesNotMatch(failed, /featured_employer: false/)
})
