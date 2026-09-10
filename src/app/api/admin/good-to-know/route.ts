import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { INDUSTRY_GROUPS, INDUSTRY_SECTIONS } from '@/lib/industry-bodies'
import { GOOD_TO_KNOW_CACHE_TAG } from '@/lib/industry-bodies-server'
import { cleanWebsiteUrl, secureImageUrl } from '@/lib/brand-profiles'

// Editing Good to Know.
//
// The page shipped as an array in the source, so every correction needed a
// developer and a deploy - on the one page whose entire value is being current
// and being right.

const SECTIONS = new Set<string>(INDUSTRY_SECTIONS.map(section => section.id))
const trim = (value: unknown, limit: number) => String(value ?? '').trim().slice(0, limit)

function payloadFrom(body: any) {
  const section = String(body.section || '')
  if (!SECTIONS.has(section)) return { error: 'Choose a section.' as const }
  const name = trim(body.name, 200)
  if (name.length < 2) return { error: 'Give the organisation a name.' as const }
  // A link that is not a link is the one thing this page cannot ship: the
  // whole promise is that every entry goes somewhere real.
  const url = cleanWebsiteUrl(body.url)
  if (!url) return { error: 'Add the organisation’s website address.' as const }

  return {
    row: {
      section,
      name,
      short_name: trim(body.short_name, 40) || null,
      url,
      // Pictures keep the strict rule: https only, because a broken photograph
      // on a page about trustworthiness is worse than no photograph.
      image_url: secureImageUrl(body.image_url),
      what: trim(body.what, 4000) || null,
      why_it_matters: trim(body.why_it_matters, 4000) || null,
      why_we_rate_it: trim(body.why_we_rate_it, 4000) || null,
      why_spas_value_it: trim(body.why_spas_value_it, 4000) || null,
      tags: (Array.isArray(body.tags) ? body.tags : String(body.tags ?? '').split(','))
        .map((tag: unknown) => trim(tag, 40)).filter(Boolean).slice(0, 8),
      is_published: body.is_published !== false,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Math.max(0, Math.floor(Number(body.sort_order))) : 0,
    },
  }
}

function published() {
  try { revalidateTag(GOOD_TO_KNOW_CACHE_TAG, 'max') } catch { /* the tag is best-effort */ }
}

export async function GET() {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('industry_bodies')
    .select('*').order('section').order('sort_order').order('created_at')

  return NextResponse.json({
    entries: error ? [] : (data || []),
    sections: INDUSTRY_SECTIONS,
    // Offered rather than done automatically: importing over a page somebody
    // has already edited would throw their writing away.
    seedAvailable: !error && (data || []).length === 0,
    unavailable: Boolean(error),
  })
}

export async function POST(req: NextRequest) {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()

  // Start from what is on the live page rather than from an empty screen.
  // Refused once anything exists, because an import is a replacement.
  if (action === 'seed') {
    const { data: existing } = await admin.from('industry_bodies').select('id').limit(1)
    if ((existing || []).length) return NextResponse.json({ error: 'There are already entries here. Importing would replace what you have written.' }, { status: 409 })

    const rows = INDUSTRY_GROUPS.flatMap(group => group.bodies.map((entry, index) => ({
      section: group.id,
      name: entry.name,
      short_name: entry.shortName || null,
      url: entry.url,
      image_url: entry.image || null,
      what: entry.what,
      why_it_matters: entry.whyItMatters,
      why_we_rate_it: entry.whyWeRateIt,
      why_spas_value_it: entry.whySpasValueIt,
      tags: entry.tags,
      sort_order: index,
      is_published: true,
    })))
    const { error } = await admin.from('industry_bodies').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    published()
    return NextResponse.json({ success: true, imported: rows.length })
  }

  if (action === 'create' || action === 'update') {
    const result = payloadFrom(body)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

    if (action === 'create') {
      const { data, error } = await admin.from('industry_bodies').insert(result.row).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      published()
      return NextResponse.json({ success: true, entry: data })
    }

    const id = trim(body.id, 60)
    if (!id) return NextResponse.json({ error: 'Which entry?' }, { status: 400 })
    const { error } = await admin.from('industry_bodies')
      .update({ ...result.row, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    published()
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const id = trim(body.id, 60)
    if (!id) return NextResponse.json({ error: 'Which entry?' }, { status: 400 })
    const { error } = await admin.from('industry_bodies').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    published()
    return NextResponse.json({ success: true })
  }

  if (action === 'reorder') {
    const order: string[] = Array.isArray(body.order) ? body.order.map((id: unknown) => trim(id, 60)).filter(Boolean) : []
    if (!order.length) return NextResponse.json({ error: 'Nothing to reorder.' }, { status: 400 })
    for (const [index, id] of order.entries()) {
      await admin.from('industry_bodies').update({ sort_order: index }).eq('id', id)
    }
    published()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
