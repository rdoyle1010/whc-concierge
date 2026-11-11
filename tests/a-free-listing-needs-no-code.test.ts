import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Free listings, and why they are not a Stripe coupon.
//
// A coupon scoped to specific products cannot work on this platform at all:
// every checkout builds its line item inline with price_data, so Stripe
// creates a throwaway product per session and a product-restricted coupon has
// nothing to attach to. That is not a configuration mistake, it is structural.
//
// launch_listing_credits already did the job and had no way to be granted.
// These assert the handle exists, is guarded, and cannot drive the balance
// negative.

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')

test('an administrator can grant free listings', () => {
  assert.equal(existsSync(join(root, 'src/app/api/admin/listing-credits/route.ts')), true)
  assert.equal(existsSync(join(root, 'src/app/admin/listing-credits/page.tsx')), true)
  assert.match(read('src/components/DashboardShell.tsx'), /\/admin\/listing-credits/)
})

test('granting free listings is admin-only on every verb', () => {
  const source = read('src/app/api/admin/listing-credits/route.ts')
  for (const verb of ['GET', 'POST']) {
    const handler = source.slice(source.indexOf(`export async function ${verb}(`))
    assert.match(handler.slice(0, 250), /adminRequestUser/, `${verb} is not guarded`)
  }
})

test('a free-listing balance cannot be driven negative or absurd', () => {
  const source = read('src/app/api/admin/listing-credits/route.ts')
  // Clearing is an explicit set floored at zero, never a negative grant.
  assert.match(source, /Math\.max\(0,\s*Math\.min\(99/)
  // Granting is clamped too, so a mistyped quantity cannot hand out hundreds.
  assert.match(source, /Math\.max\(1,\s*Math\.min\(20/)
})

test('it reuses the grant the platform already had', () => {
  // Rather than a second place that writes the column, which is how two
  // balances that disagree get created.
  assert.match(read('src/app/api/admin/listing-credits/route.ts'), /grantListingCredits/)
  assert.match(read('src/lib/launch-offers.ts'), /export async function grantListingCredits/)
})

test('a property with credits is told it will not pay', () => {
  // The other half of the promise: the page the property actually posts from.
  const postRole = read('src/app/employer/post-role/page.tsx')
  assert.match(postRole, /launch_listing_credits/)
  assert.match(postRole, /publishes without payment/)
})
