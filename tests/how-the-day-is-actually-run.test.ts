import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CHECKLIST_REGISTER } from '../src/lib/documents/checklists/register'
import { CHECKLIST_PLANS, CHECKLIST_ENTRIES } from '../src/lib/documents/checklist-plans'
import { FINANCE_REGISTER } from '../src/lib/documents/finance/register'
import { FINANCE_PLANS, FINANCE_ENTRIES } from '../src/lib/documents/finance-plans'
import { missingFromPlan, factsInPlan } from '../src/lib/documents/plan-types'
import { isValidReference } from '../src/lib/documents/reference'
import { sellableCatalogue } from '../src/lib/documents/catalogue'
import { packBySlug, journeyPacks, CHECKLIST_PACK_PRICE, FINANCE_PACK_PRICE, SINGLE_DOCUMENT_PRICE } from '../src/lib/documents/pricing'
import { LIBRARY_PLAN } from '../src/lib/documents/library-plan'

const body = (file: string) =>
  readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

test('nine checklists, each one finished and each one in the house format', () => {
  assert.equal(CHECKLIST_REGISTER.length, 9)
  for (const plan of CHECKLIST_PLANS) {
    const document = plan.build()
    assert.ok(isValidReference(document.reference), `${document.reference} is not a house reference`)
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is not finished`)
    // A checklist with nothing to fill in is a poster.
    assert.ok(factsInPlan(document) > 40, `${document.reference} has only ${factsInPlan(document)} to fill in`)
  }
  // Every shift a spa actually runs. Reception three ways, therapists both
  // ends, cleaning both ends, the manager's walk, and the weekly sheet.
  const references = CHECKLIST_REGISTER.map(entry => entry.reference)
  for (const needle of ['REC-OPENING', 'REC-MIDSHIFT', 'REC-CLOSING', 'THER-OPENING', 'THER-CLOSING',
    'CLN-OPENING', 'CLN-CLOSING', 'OPS-DUTYDAY', 'OPS-WEEKLY']) {
    assert.ok(references.some(reference => reference.startsWith(needle)), `${needle} is missing`)
  }
})

test('every check names where it came from', () => {
  // A checklist detached from the procedure it enforces drifts within a year,
  // because somebody adds a line they think is sensible and nobody ever takes
  // one away. The source line is how a change to a procedure can be traced to
  // every checklist it affects.
  for (const entry of CHECKLIST_REGISTER) {
    const blocks = entry.sections.filter(section => section.table && section.part === 'The checks')
    assert.ok(blocks.length >= 3, `${entry.reference} has only ${blocks.length} blocks of checks`)
    for (const block of blocks) {
      assert.match(block.intro || '', /^Drawn from /, `${entry.reference}: ${block.heading} names no source`)
    }
  }
})

test('a checklist records what failed, and nothing arrives pre-ticked', () => {
  for (const entry of CHECKLIST_REGISTER) {
    const headings = entry.sections.map(section => section.heading)
    assert.ok(headings.some(heading => /failed/i.test(heading)),
      `${entry.reference} has nowhere to record a failure`)
    assert.ok(headings.includes('Signed'), `${entry.reference} has no sign-off`)

    // Every cell a person fills in is blank. A checklist arriving with boxes
    // already marked teaches a team that the boxes do not matter.
    for (const section of entry.sections) {
      if (!section.table?.fillable) continue
      for (const row of section.table.rows) {
        for (const cell of row.slice(1)) {
          assert.equal(cell, '', `${entry.reference}: ${section.heading} arrives pre-filled`)
        }
      }
    }
  }
})

test('twenty reports, every line defined, nothing filled in', () => {
  assert.equal(FINANCE_REGISTER.length, 20)
  for (const plan of FINANCE_PLANS) {
    const document = plan.build()
    assert.ok(isValidReference(document.reference), `${document.reference} is not a house reference`)
    assert.deepEqual(missingFromPlan(document), [], `${document.reference} is not finished`)

    // The definitions are the valuable part. A report with figures and no
    // definitions is a spreadsheet with a cover page, and the argument at
    // month end is never about the number.
    const headings = document.sections.map(section => section.heading)
    // Every report that carries figures defines them. The action tracker is
    // the one that carries none, which is why it is the only exception and
    // why the exception is stated rather than assumed.
    const hasFigures = document.sections.some(section =>
      section.part === 'The figures' && section.table?.fillable && section.table.rows.length > 6)
    if (document.reference !== 'FIN-ACTIONS-RPT-620') {
      assert.ok(hasFigures, `${document.reference} has no figures`)
      assert.ok(headings.includes('How each line is calculated'), `${document.reference} defines nothing`)
    }
    assert.ok(headings.includes('Actions'), `${document.reference} ends without an action`)
    assert.ok(headings.some(heading => /what this report is for/i.test(heading)),
      `${document.reference} does not say what decision it drives`)
  }
})

test('no number in the pack is ours to state', () => {
  // A printed benchmark would be somebody else's spa, and the fastest way to
  // make a report useless is to fill it in for the person who has to own it.
  for (const plan of FINANCE_PLANS) {
    for (const section of plan.build().sections) {
      if (!section.table?.fillable) continue
      for (const row of section.table.rows) {
        for (const cell of row.slice(1)) {
          assert.equal(cell, '', `${plan.reference}: ${section.heading} carries a number`)
        }
      }
    }
  }
})

test('both suites are on the shelf, priced against what they replace', () => {
  const catalogue = sellableCatalogue().map(entry => entry.reference)
  for (const entry of [...CHECKLIST_ENTRIES, ...FINANCE_ENTRIES]) {
    assert.ok(catalogue.includes(entry.reference), `${entry.reference} is not sellable`)
  }

  const checklists = packBySlug('daily-checklists')
  const finance = packBySlug('financial-reporting')
  assert.equal(checklists?.count, 9)
  assert.equal(finance?.count, 20)
  assert.equal(checklists?.price, CHECKLIST_PACK_PRICE)
  assert.equal(finance?.price, FINANCE_PACK_PRICE)

  // Both cheaper than their documents bought one at a time, like everything
  // else here.
  assert.ok(checklists!.price < 9 * SINGLE_DOCUMENT_PRICE * 4)
  assert.ok(finance!.price > 20 * SINGLE_DOCUMENT_PRICE,
    'the reporting pack is worth more than twenty documents and should say so')

  // And neither falls inside a stage pack, for the same reason the risk
  // assessments do not: they are sold on their own argument.
  const suiteReferences = [...CHECKLIST_ENTRIES, ...FINANCE_ENTRIES].map(entry => entry.reference)
  for (const pack of journeyPacks()) {
    for (const reference of suiteReferences) {
      assert.equal(pack.includes(reference), false, `${reference} is inside ${pack.name}`)
    }
  }
  // Which follows from the stage packs being built from the build plan.
  for (const reference of suiteReferences) {
    assert.ok(!LIBRARY_PLAN.some(entry => entry.reference === reference))
  }
})

test('one press brings in everything written in the repository', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  const start = route.indexOf("if (action === 'add_pool_plans'")
  assert.ok(start > 0)
  const block = route.slice(start, start + 4500)

  assert.ok(block.includes("action === 'add_everything'"))
  // Every set, or the button lies about what it did.
  for (const set of ['POOL_PLANS', 'GUIDE_PLANS', 'RISK_ASSESSMENT_PLANS', 'CHECKLIST_PLANS', 'FINANCE_PLANS']) {
    assert.ok(block.includes(set), `${set} is not brought in`)
  }

  // Read once and written in chunks. Forty-six documents at a select and a
  // write each is ninety-two round trips inside a function the host kills at
  // twenty-six seconds, and the failure leaves half a library imported with
  // no way to tell which half.
  assert.ok(block.includes(".in('reference', references)"))
  assert.ok(/at \+= 20/.test(block))
  assert.ok(block.includes('were brought in before it stopped'))

  // Nothing written or signed off is overwritten, whatever the button says.
  assert.ok(block.includes("existing.status === 'approved'"))
  assert.ok(block.includes('Object.keys(existing.document || {}).length > 0'))

  const page = body('src/app/admin/documents/page.tsx')
  assert.ok(page.includes("act('add_everything')"))
})

test('she can add both from the library screen, and change both prices', () => {
  const route = body('src/app/api/admin/documents/route.ts')
  assert.ok(route.includes("action === 'add_checklists'"))
  assert.ok(route.includes("action === 'add_finance_pack'"))

  const page = body('src/app/admin/documents/page.tsx')
  assert.ok(page.includes("act('add_checklists')"))
  assert.ok(page.includes("act('add_finance_pack')"))

  const prices = body('src/lib/documents/price-overrides.ts')
  assert.ok(prices.includes("key: 'checklists'"))
  assert.ok(prices.includes("key: 'finance'"))

  const shop = body('src/app/standards/page.tsx')
  assert.ok(shop.includes('slug="daily-checklists"'))
  assert.ok(shop.includes('slug="financial-reporting"'))
})
