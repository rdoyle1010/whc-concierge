import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { loadPrices, loadBundles, referencesInBundle } from '@/lib/documents/pricing-server'
import { loadAttachments } from '@/lib/documents/attachments-server'
import { formatOf } from '@/lib/documents/formats'
import { TOOLS, TOOL_BUNDLE } from '@/lib/documents/tools/registry'

// What is actually on the shelf.
//
// A shop that lists four hundred and sixty documents and can deliver one is
// a shop that gets found out on the first order. Only a signed off document
// can be sold, which is the whole point of the sign-off, so this counts what
// is signed off and the page says so plainly.
//
// Public and read only. It returns counts and titles, never a document: the
// content is the product.

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin.from('operational_documents')
    .select('reference, title, department, tier, status')
    .is('employer_id', null).eq('status', 'approved').limit(2000)

  // A shop that cannot reach its stock says so, rather than showing an empty
  // one. Those are different facts and only one of them is her fault.
  if (error) return NextResponse.json({ available: [], unavailable: true })

  const prices = await loadPrices(admin)
  const bundles = await loadBundles(true, admin)

  // The files that travel with a pack, named and with their format.
  //
  // "36 documents" tells somebody spending eight hundred pounds nothing about
  // what lands in their inbox. Whether the reporting pack contains an actual
  // spreadsheet or a picture of one is the question that decides the sale,
  // and it was only answerable after paying.
  //
  // Names and formats only. The file itself is the product.
  const attachments = await loadAttachments(true, admin)

  return NextResponse.json({
    available: (data || []).map((row: any) => ({
      reference: row.reference,
      title: row.title,
      department: row.department,
      tier: row.tier,
    })),
    planned: sellableCatalogue().length,
    // Live prices, so the shop and the checkout cannot disagree about what
    // something costs. A page showing one number and a till charging another
    // is a refund and a review.
    prices,
    // Only the live ones, and only what each covers, so the page can say how
    // much of a bundle is ready without a second request.
    bundles: bundles.map(bundle => ({
      slug: bundle.slug,
      name: bundle.name,
      blurb: bundle.blurb,
      price: bundle.pricePence,
      references: referencesInBundle(bundle, prices),
    })),
    // The tools built in code, listed beside the files she uploads. A buyer
    // does not care which of the two a working spreadsheet came from.
    tools: TOOLS.map(tool => ({
      slug: tool.slug,
      name: tool.name,
      blurb: tool.blurb,
      detail: tool.detail,
      price: tool.pricePence,
      sheets: tool.sheets,
    })),
    toolkit: {
      slug: TOOL_BUNDLE.slug,
      name: TOOL_BUNDLE.name,
      blurb: TOOL_BUNDLE.blurb,
      detail: TOOL_BUNDLE.detail,
      price: TOOL_BUNDLE.pricePence,
      // Worked out rather than typed, so the saving on the card cannot drift
      // from the prices beside it.
      singly: TOOLS.reduce((total, tool) => total + tool.pricePence, 0),
      count: TOOLS.length,
    },
    files: attachments.map(attachment => ({
      name: attachment.name,
      description: attachment.description,
      format: formatOf(attachment.contentType, attachment.fileName),
      sizeBytes: attachment.sizeBytes,
      packSlugs: attachment.packSlugs,
      // Present only on the ones she sells on their own, so the shop can list
      // them without a second request and without guessing.
      slug: attachment.slug,
      price: attachment.pricePence,
    })),
  })
}
