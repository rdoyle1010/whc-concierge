import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadPrices, loadBundles } from '@/lib/documents/pricing-server'
import { PRICE_KEYS, priceIsSane, slugify, type PriceKey } from '@/lib/documents/price-overrides'
import { departmentPacks, tierPacks } from '@/lib/documents/pricing'
import { sellableCatalogue } from '@/lib/documents/catalogue'

// Prices and bundles, edited by her rather than deployed by me.
//
// A price is a commercial decision made on a Tuesday afternoon, usually in
// response to something a buyer said. It should not need a developer, and
// waiting a day for one is how a price stays wrong for a quarter.

export const dynamic = 'force-dynamic'

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const admin = createAdminClient()
  const prices = await loadPrices(admin)
  const bundles = await loadBundles(false, admin)

  return NextResponse.json({
    // The default and the override side by side, so she can see what she has
    // changed and what she has not, and put one back.
    prices: PRICE_KEYS.map(entry => ({
      key: entry.key,
      label: entry.label,
      why: entry.why,
      fallback: entry.fallback,
      current: prices[entry.key] ?? entry.fallback,
      overridden: prices[entry.key] !== undefined,
    })),
    bundles,
    // What a bundle can be built from.
    packs: [...tierPacks(prices), ...departmentPacks(prices)].map(pack => ({
      slug: pack.slug, name: pack.name, count: pack.count, price: pack.price,
    })),
    documents: sellableCatalogue().map(entry => ({
      reference: entry.reference, title: entry.title, department: entry.department,
    })),
  })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()

  if (action === 'set_price') {
    const key = String(body.key || '') as PriceKey
    if (!PRICE_KEYS.some(entry => entry.key === key)) {
      return NextResponse.json({ error: 'That is not a price this shop has.' }, { status: 400 })
    }
    const checked = priceIsSane(body.pricePence)
    if (!checked.ok) return NextResponse.json({ error: checked.reason }, { status: 400 })

    const { error } = await admin.from('standards_pricing').upsert({
      key, price_pence: checked.pence, updated_by: actor.id, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, note: 'Saved. It is live on the shop now.' })
  }

  if (action === 'reset_price') {
    const key = String(body.key || '')
    const { error } = await admin.from('standards_pricing').delete().eq('key', key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Deleting the row is what restores the default, rather than writing the
    // default in as a value. A stored default stops being the default the day
    // the code changes and nobody notices.
    return NextResponse.json({ success: true, note: 'Put back to the price in the code.' })
  }

  if (action === 'save_bundle') {
    const name = String(body.name || '').trim()
    if (name.length < 3) return NextResponse.json({ error: 'Give the bundle a name.' }, { status: 400 })

    const checked = priceIsSane(body.pricePence)
    if (!checked.ok) return NextResponse.json({ error: checked.reason }, { status: 400 })

    const packSlugs: string[] = Array.isArray(body.packSlugs) ? body.packSlugs.map(String) : []
    const references: string[] = Array.isArray(body.documentReferences) ? body.documentReferences.map(String) : []
    if (!packSlugs.length && !references.length) {
      return NextResponse.json({ error: 'A bundle with nothing in it is a bundle that delivers nothing.' }, { status: 400 })
    }

    // Every reference checked against the catalogue, so a typo cannot create
    // a bundle that sells a document nobody can deliver.
    const known = new Set(sellableCatalogue().map(entry => entry.reference))
    const unknown = references.filter(reference => !known.has(reference))
    if (unknown.length) {
      return NextResponse.json({ error: `Not in the library: ${unknown.slice(0, 3).join(', ')}.` }, { status: 400 })
    }
    const knownPacks = new Set([...tierPacks(), ...departmentPacks()].map(pack => pack.slug))
    const unknownPacks = packSlugs.filter(slug => !knownPacks.has(slug))
    if (unknownPacks.length) {
      return NextResponse.json({ error: `Not a pack: ${unknownPacks.slice(0, 3).join(', ')}.` }, { status: 400 })
    }

    const row = {
      slug: String(body.slug || '').trim() || slugify(name),
      name,
      blurb: String(body.blurb || '').trim() || null,
      price_pence: checked.pence,
      pack_slugs: packSlugs,
      document_references: references,
      is_live: body.isLive === true,
      sort_order: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
      updated_at: new Date().toISOString(),
    }

    const { error } = body.id
      ? await admin.from('standards_bundles').update(row).eq('id', String(body.id))
      : await admin.from('standards_bundles').insert(row)
    if (error) {
      return NextResponse.json({
        error: error.message.includes('duplicate') ? 'A bundle already uses that web address.' : error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      note: row.is_live ? 'Saved and live on the shop.' : 'Saved. It is not on the shop until you make it live.',
    })
  }

  if (action === 'delete_bundle') {
    const { error } = await admin.from('standards_bundles').delete().eq('id', String(body.id || ''))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, note: 'Deleted. Anybody who already bought it keeps it.' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
