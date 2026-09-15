import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { attachmentsForSlugs, soldSeparately, fileSlug, type Attachment } from '../src/lib/documents/attachments'
import { departmentPacks, journeyPacks, tierPacks } from '../src/lib/documents/pricing'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const file = (over: Partial<Attachment> = {}): Attachment => ({
  id: 'one',
  name: 'Spa Audit',
  description: null,
  storagePath: 'x/spa-audit.xlsx',
  fileName: 'Spa Audit.xlsx',
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  sizeBytes: 205000,
  packSlugs: ['spa-management-team'],
  slug: 'file-spa-audit',
  pricePence: 24500,
  isLive: true,
  sortOrder: 0,
  replacesWorkbook: false,
  ...over,
})

test('buying the file itself delivers it, and so does buying a pack it is in', () => {
  // Its slug shares the namespace with pack slugs, so an order carrying it
  // needs no new plumbing at either end: entitlement already resolves a
  // buyer's slugs to the files they can download.
  assert.equal(attachmentsForSlugs([file()], ['file-spa-audit']).length, 1, 'bought on its own')
  assert.equal(attachmentsForSlugs([file()], ['spa-management-team']).length, 1, 'bought inside a pack')
  assert.equal(attachmentsForSlugs([file()], ['reception-team']).length, 0, 'bought neither')
})

test('a file slug cannot take a pack checkout', () => {
  // These share one namespace. A file called "The Complete Library" quietly
  // standing in front of the pack of that name is a two thousand four hundred
  // and fifty pound sale leaking into a two hundred pound one.
  const packSlugs = new Set([...departmentPacks(), ...journeyPacks(), ...tierPacks()].map(pack => pack.slug))
  for (const name of ['The Complete Library', 'Reception Team', 'Spa Risk Assessment Suite', 'anything at all']) {
    assert.ok(!packSlugs.has(fileSlug(name)), `${fileSlug(name)} collides with a pack`)
    assert.match(fileSlug(name), /^file-/)
  }
  assert.equal(fileSlug('Spa Audit'), 'file-spa-audit')
  assert.equal(fileSlug('!!!'), 'file-untitled', 'a name of punctuation still produces a usable slug')
})

test('only a live, priced, slugged file is on sale', () => {
  // Each of these on its own is a buy button that takes money and delivers
  // nothing, or a price on something nobody can reach.
  assert.equal(soldSeparately([file()]).length, 1)
  assert.equal(soldSeparately([file({ isLive: false })]).length, 0, 'not live')
  assert.equal(soldSeparately([file({ pricePence: null })]).length, 0, 'no price')
  assert.equal(soldSeparately([file({ slug: null })]).length, 0, 'nothing to buy')
})

test('the checkout prices a file from the database, never from the page', () => {
  const route = body('src/app/api/standards/checkout/route.ts')
  assert.match(route, /soldSeparately\(await loadAttachments\(true, admin\)\)/,
    'read at the moment of sale, and only the ones actually on sale')
  assert.match(route, /amountPence: file\.pricePence as number/)
  // The rule that holds for every other purchase here.
  assert.doesNotMatch(route, /body\.amount|body\.price/, 'a price from the browser is a library bought for a pound')
  // A file is completed, not signed off. Telling somebody to sign off a
  // spreadsheet is the wording that makes a buyer wonder who read the page.
  assert.match(route, /FILE_STATUS/)
})

test('a price cannot be set on something nobody can receive', () => {
  const route = body('src/app/api/admin/standards-files/route.ts')
  assert.match(route, /Make it live before pricing it/)
  assert.match(route, /A standalone price has to be between one pound and five thousand/)
  // Money in pence, like every other price here. A float is the wrong type
  // for money and the rounding shows up as a penny out on a receipt.
  assert.match(route, /Math\.round\(rawPrice \* 100\)/)
  // The slug is kept once set: changing it orphans every order carrying it.
  assert.match(route, /current\?\.slug \|\| fileSlug/)

  const migration = body('supabase/migrations/20260914270000_a_file_sold_on_its_own.sql')
  assert.match(migration, /price_pence is null or slug is not null/, 'the database says it too')
  assert.match(migration, /price_pence between 100 and 500000/)
})

test('it is on the shop, above the packs', () => {
  const shop = body('src/components/StandardsCatalogue.tsx')
  assert.ok(shop.includes('<StandardsTools files={files} tools={tools} />'),
    'the section carries both the uploaded files and the tools built in code')
  assert.ok(shop.indexOf('StandardsTools') < shop.indexOf('id="packs"'),
    'the cheapest way in belongs above the eight hundred pound packs')

  const tools = body('src/components/StandardsTools.tsx')
  assert.ok(tools.includes('file.slug && (file.price || 0) > 0'), 'only the ones actually on sale')
  assert.ok(tools.includes('BuyButton'))
  assert.ok(tools.includes('also included with the packs it belongs to'),
    'a buyer who owns a pack should not pay twice by accident')
})

test('the receipt names what was bought', () => {
  // A file slug is one packBySlug does not know, so the receipt read "You
  // have bought your documents" under the subject "Your documents are ready:
  // Talent House Collective". A receipt that cannot name the thing it is
  // charging for is the first thing a buyer forwards to finance with a
  // question attached.
  const email = body('src/lib/documents/receipt-email.ts')
  assert.match(email, /itemName\?: string \| null/)
  assert.match(email, /input\.itemName \|\| 'your documents'/)
  assert.match(email, /single\?\.title \|\| input\.itemName/)

  const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')
  assert.match(fulfilment, /startsWith\('file-'\)/, 'looked up only for the purchases that need it')
  assert.match(fulfilment, /from\('standards_attachments'\)\s*\n?\s*\.select\('name'\)\.eq\('slug', meta\.pack_slug\)/)
  assert.match(fulfilment, /itemName,/)
})

test('a paid file reaches the buyer through the same door as everything else', () => {
  // Fulfilment stores the slug verbatim rather than checking it against a
  // list of packs, which is why a file slug needed no new branch there. Said
  // out loud so nobody adds that validation later and silently breaks this.
  const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')
  assert.match(fulfilment, /pack_slug: meta\.pack_slug \|\| null/)
  assert.doesNotMatch(fulfilment, /packBySlug\(meta\.pack_slug\)/,
    'fulfilment must not require the slug to be a known pack')
})
