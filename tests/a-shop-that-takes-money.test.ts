import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { packReadiness, referencesForOrder, ownedReferences, priceSingle, pricePack } from '../src/lib/documents/stock'
import { packBySlug, SINGLE_DOCUMENT_PRICE, DEPARTMENT_PACK_PRICE, departmentPrice } from '../src/lib/documents/pricing'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const everything = new Set(LIBRARY_PLAN.map(entry => entry.reference))
const firstDepartment = LIBRARY_PLAN[0].department
const departmentSlug = `department-${firstDepartment.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

test('a pack goes on sale only when every document in it is signed off', () => {
  const pack = packBySlug(departmentSlug)!
  assert.ok(pack, 'the department pack should resolve')

  const none = packReadiness(pack, new Set())
  assert.equal(none.buyable, false)
  assert.equal(none.ready, 0)

  const all = packReadiness(pack, everything)
  assert.equal(all.buyable, true)
  assert.equal(all.ready, all.total)

  // One short is not ready. This is the whole rule: a buyer who pays for a
  // department and receives all but one of it has been sold something else.
  const oneShort = new Set(everything)
  const dropped = LIBRARY_PLAN.find(entry => pack.includes(entry.reference))!.reference
  oneShort.delete(dropped)
  assert.equal(packReadiness(pack, oneShort).buyable, false)
})

test('an order entitles its buyer to exactly what the pack covers', () => {
  const single = referencesForOrder({ document_reference: 'REC-OPEN-CHK-001' })
  assert.deepEqual(single, ['REC-OPEN-CHK-001'])

  const complete = referencesForOrder({ pack_slug: 'the-complete-library' })
  assert.equal(complete.length, LIBRARY_PLAN.length)

  // A slug nobody sells entitles nobody to anything, rather than everything.
  assert.deepEqual(referencesForOrder({ pack_slug: 'not-a-pack' }), [])
  assert.deepEqual(referencesForOrder({}), [])
})

test('two purchases add up rather than replacing each other', () => {
  // Bought a department in March and one extra document in June. Showing them
  // only the most recent order shows them less than they paid for.
  const owned = ownedReferences([
    { pack_slug: departmentSlug },
    { document_reference: 'AUD-INTERNAL-AUDIT-PROGRAMME-SCHEDULE-SOP-460' },
  ])
  assert.ok(owned.has('AUD-INTERNAL-AUDIT-PROGRAMME-SCHEDULE-SOP-460'))
  const inDepartment = LIBRARY_PLAN.find(entry => entry.department === firstDepartment)!
  assert.ok(owned.has(inDepartment.reference))
})

test('a pack never costs more than buying its documents one at a time', () => {
  for (const pack of LIBRARY_PLAN.reduce((seen, entry) => {
    seen.set(entry.department, (seen.get(entry.department) || 0) + 1)
    return seen
  }, new Map<string, number>()).values()) {
    assert.ok(departmentPrice(pack) <= pack * SINGLE_DOCUMENT_PRICE,
      'a pack dearer than its parts is a pack nobody buys twice')
    assert.ok(departmentPrice(pack) <= DEPARTMENT_PACK_PRICE)
  }
})

test('nothing unfinished can be paid for', () => {
  const refused = priceSingle('REC-OPEN-CHK-001', new Set(), SINGLE_DOCUMENT_PRICE)
  assert.equal(refused.ok, false)
  assert.match((refused as any).reason, /still in preparation/)

  const unknown = priceSingle('NOT-A-REAL-REF-SOP-999', everything, SINGLE_DOCUMENT_PRICE)
  assert.equal(unknown.ok, false)

  const sold = priceSingle('REC-OPEN-CHK-001', everything, SINGLE_DOCUMENT_PRICE)
  assert.equal(sold.ok, true)
  assert.equal((sold as any).amountPence, SINGLE_DOCUMENT_PRICE)

  // And the refusal says how far along it is, because a number gets a reply
  // and "not available" gets a closed tab.
  const partPack = pricePack(departmentSlug, new Set())
  assert.equal(partPack.ok, false)
  assert.match((partPack as any).reason, /of \d+ in that pack are signed off/)
})

test('the browser never says what anything costs', () => {
  const checkout = body('src/app/api/standards/checkout/route.ts')
  // Only these two come off the request. An amount from the page is a shop
  // where the complete library costs a pound.
  assert.match(checkout, /body\.packSlug/)
  assert.match(checkout, /body\.reference/)
  assert.doesNotMatch(checkout, /body\.(price|amount|amountPence)/)
  assert.match(checkout, /unit_amount: purchase\.amountPence/)

  // Stock is read at the moment of sale, not trusted from the page.
  assert.match(checkout, /\.eq\('status', 'approved'\)/)
  assert.match(checkout, /nothing has been charged/)

  const button = body('src/components/BuyButton.tsx')
  assert.doesNotMatch(button, /amount|unit_amount/, 'the button posts what, never how much')
})

test('a download is refused unless that buyer bought it', () => {
  const download = body('src/app/api/standards/download/route.ts')
  assert.match(download, /ownedReferences\(orders\)\.has\(reference\)/)
  assert.match(download, /not part of what you bought/)
  // And only a signed off document ever leaves the platform.
  assert.match(download, /\.eq\('status', 'approved'\)/)
})

test('a paid purchase has two ways of being delivered', () => {
  // Fulfilment in the webhook alone took the money and delivered nothing for
  // several days on this platform when its URL was wrong, with nothing that
  // would ever have noticed.
  const library = body('src/app/api/standards/library/route.ts')
  assert.match(library, /fulfilCheckoutSession/)
  assert.match(library, /payment_status === 'paid'/)

  const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')
  const branch = fulfilment.slice(
    fulfilment.indexOf("meta?.type === 'standards'"),
    fulfilment.indexOf("meta?.type === 'sponsored_ad'"),
  )
  assert.ok(branch.length > 500, 'the standards branch should have been found')
  // One row per Stripe session, so the webhook and the browser cannot deliver
  // the same purchase twice.
  assert.match(branch, /onConflict: 'stripe_checkout_session_id'/)
  // The email is the delivery. A failure to send is a failure to deliver.
  assert.match(branch, /receipt_sent_at/)
  assert.match(branch, /notifyAdmins/)
  assert.match(branch, /paid and have nothing/)
})

test('a purchase lives on the dashboard, not only in an email', () => {
  const shell = body('src/components/DashboardShell.tsx')
  // Every workspace that can buy one. A talent, a property and a consultancy
  // see the same shelf, so it is one page rather than three to keep in step.
  for (const workspace of ['talent', 'employer', 'consultant']) {
    const list = shell.slice(shell.indexOf(`${workspace}: [`), shell.indexOf('],', shell.indexOf(`${workspace}: [`)))
    assert.ok(list.length > 100, `the ${workspace} navigation should have been found`)
    assert.match(list, /My Documents', href: '\/my-documents'/, `${workspace} cannot reach what it bought`)
  }
})

test('a signed-in buyer does not need to find their receipt', () => {
  const download = body('src/app/api/standards/download/route.ts')
  // Two ways of being the buyer, because there are two ways of buying.
  assert.match(download, /if \(token\) \{/)
  assert.match(download, /createServerSupabaseClient/)
  assert.match(download, /buyer_user_id\.eq\.\$\{user\.id\}/)
  // And neither way skips the entitlement check.
  assert.match(download, /ownedReferences\(orders\)\.has\(reference\)/)

  const mine = body('src/app/api/standards/mine/route.ts')
  assert.match(mine, /Unauthorised/)
  // Bought before they had an account, claimed onto it the first time they
  // look, so it is theirs on every device from then on.
  assert.match(mine, /buyer_user_id: user\.id/)
})

test('the receipt link is not a dead end', () => {
  const page = body('src/components/BuyerLibrary.tsx')
  assert.match(page, /<Navbar \/>/)
  assert.match(page, /<Footer \/>/)
  assert.match(page, /href="\/standards"/)
  // And it says plainly that the link is the only key without an account.
  assert.match(page, /only way back without an account/)
})
