import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_BILLING_IDENTITY, parseBillingIdentity, vatStatement, sellerLines,
  missingForInvoicing, documentSellerName, dueDate,
} from '../src/lib/billing-identity'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// A wrong VAT statement on an invoice is worth money, in both directions:
// charging VAT while unregistered, or omitting it once registered.
test('the VAT position is never invented', () => {
  assert.match(vatStatement(DEFAULT_BILLING_IDENTITY), /Not VAT registered/)
  const registeredNoNumber = parseBillingIdentity({ vatMode: 'registered' })
  assert.equal(vatStatement(registeredNoNumber), '', 'registered with no number says nothing rather than guessing')
  const registered = parseBillingIdentity({ vatMode: 'registered', vatNumber: 'GB123456789' })
  assert.match(vatStatement(registered), /GB123456789/)
})

// A number left behind after deregistering would be printed as current fact.
test('a VAT number is dropped when the position is not registered', () => {
  const identity = parseBillingIdentity({ vatMode: 'not_registered', vatNumber: 'GB123456789' })
  assert.equal(identity.vatNumber, '')
  assert.match(vatStatement(identity), /no VAT has been charged/)
})

// A hotel's accounts payable team files against a legal entity and a company
// number. Without them the document is returned and the payment waits.
test('an incomplete seller block is reported rather than printed empty', () => {
  const missing = missingForInvoicing(DEFAULT_BILLING_IDENTITY)
  for (const field of ['Registered company name', 'Company number', 'Registered office address']) {
    assert.ok(missing.includes(field), `${field} must be flagged as missing`)
  }
  const complete = parseBillingIdentity({
    legalName: 'Example Ltd', companyNumber: '12345678',
    registeredAddress: '1 Example Street', billingEmail: 'accounts@example.com',
  })
  assert.deepEqual(missingForInvoicing(complete), [])
  assert.deepEqual(sellerLines(complete), ['1 Example Street', 'Company number 12345678', 'accounts@example.com'])
  assert.equal(documentSellerName(complete), 'Example Ltd')
})

// Blank lines are omitted, never printed as empty rows on a document.
test('unfilled seller lines are left off the document', () => {
  assert.deepEqual(sellerLines(DEFAULT_BILLING_IDENTITY), [])
  assert.equal(documentSellerName(DEFAULT_BILLING_IDENTITY), 'Talent House Collective')
})

test('payment terms drive the due date', () => {
  const identity = parseBillingIdentity({ paymentTermsDays: 14 })
  assert.equal(dueDate(new Date('2026-09-03T00:00:00Z'), identity).toISOString().slice(0, 10), '2026-09-17')
  // Nonsense terms fall back rather than producing a date in the past.
  assert.equal(parseBillingIdentity({ paymentTermsDays: -5 }).paymentTermsDays, 14)
  assert.equal(parseBillingIdentity({ paymentTermsDays: 9999 }).paymentTermsDays, 14)
})

// A public endpoint is exactly where bank details get harvested, and a receipt
// for money already taken has no reason to carry them.
test('bank details never leave through the public identity endpoint', () => {
  const route = read('src/app/api/billing-identity/route.ts')
  assert.match(route, /bankName, bankAccountName, bankSortCode, bankAccountNumber, \.\.\.publicIdentity/,
    'the bank fields must be stripped before the response')
  assert.ok(!/identity\s*\}\)/.test(route.replace('publicIdentity', 'X')), 'the full identity must never be returned')
})

// Job adverts are the commonest employer purchase. Without a ledger row there
// is no receipt to print and the month's revenue does not count them.
// Publishing a paid role now lives in one library shared by the webhook and
// the confirm route the browser calls on its way back from Stripe, so the
// ordering is asserted where the work happens rather than in one of its two
// callers.
test('a paid job advert is written to the purchase ledger', () => {
  const lib = read('src/lib/job-posting-fulfilment.ts')
  const publish = lib.slice(lib.indexOf('export async function publishPaidJobPosting'))
  const untilUpdate = publish.slice(0, publish.indexOf('job_listings'))
  assert.match(untilUpdate, /recordCommercialPurchase/, 'the ledger row is written before the listing goes live')
  // And both callers go through it, or one of them banks nothing.
  assert.match(read('src/app/api/stripe/webhook/route.ts'), /publishPaidJobPosting/)
  assert.match(read('src/app/api/employer/jobs/confirm-payment/route.ts'), /publishPaidJobPosting/)
})

// The ledger is idempotent on the Stripe session, so a webhook replay must not
// bank the same money twice.
test('the ledger cannot double-count a replayed webhook', () => {
  const lib = read('src/lib/commercial-fulfilment.ts')
  const helper = lib.slice(lib.indexOf('export async function recordCommercialPurchase'))
  assert.match(helper.slice(0, helper.indexOf('\n}')), /onConflict: 'stripe_session_id'/)
})

// Documents are printed from these pages. Anything that is screen furniture
// has to disappear when they are.
test('screen furniture is hidden when a document is printed', () => {
  assert.match(read('src/components/PaymentDocument.tsx'), /print:hidden/)
  assert.match(read('src/components/CookieConsent.tsx'), /print:hidden/)
})

// The billing page used to show a tier's list price as though it were the
// amount paid, which is not what a finance team reconciles against.
test('the employer billing page shows what was actually paid', () => {
  const page = read('src/app/employer/billing/page.tsx')
  assert.match(page, /\/api\/purchases/, 'the payment history comes from the ledger')
  assert.match(page, /Payments &amp; receipts/, 'the real record is labelled as such')
  assert.match(page, /List prices, for reference/, 'the list-price table has to say that is what it is')
})
