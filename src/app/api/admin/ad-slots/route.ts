import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AD_PLACEMENTS, isAdPlacement } from '@/lib/advertising'

// The advertising control room: switch slots on and off, pin adverts to
// slots, and place direct adverts for brands that come to WHC by email.

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const [{ data: slotRows, error: slotError }, { data: adverts }] = await Promise.all([
    admin.from('ad_slot_settings').select('*'),
    admin.from('ad_placements')
      .select('id, brand_name, tagline, logo_url, website_url, placement, status, payment_status, review_status, source, start_date, end_date, impression_count, click_count, contact_email, created_at')
      .order('created_at', { ascending: false }).limit(200),
  ])
  if (slotError) return NextResponse.json({ error: 'The ad_slot_settings table is missing - run the ad slots migration first.' }, { status: 500 })
  const settings = new Map((slotRows || []).map(row => [row.slot_key, row]))
  const slots = Object.entries(AD_PLACEMENTS).map(([key, config]) => ({
    slot_key: key,
    label: config.label,
    page: (config as any).page || 'Site',
    monthly_pence: config.monthlyPence,
    enabled: Boolean(settings.get(key)?.enabled),
    pinned_placement_id: settings.get(key)?.pinned_placement_id || null,
  }))
  return NextResponse.json({ slots, adverts: adverts || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const body = await req.json()
    const action = String(body.action || '')
    const admin = createAdminClient()
    const now = new Date().toISOString()

    if (action === 'set_slot') {
      const slotKey = String(body.slotKey || '')
      if (!isAdPlacement(slotKey)) return NextResponse.json({ error: 'Unknown slot.' }, { status: 400 })
      const update: Record<string, any> = { slot_key: slotKey, updated_at: now }
      if (body.enabled !== undefined) update.enabled = Boolean(body.enabled)
      if (body.pinnedPlacementId !== undefined) update.pinned_placement_id = body.pinnedPlacementId || null
      const { error } = await admin.from('ad_slot_settings').upsert(update, { onConflict: 'slot_key' })
      if (error) return NextResponse.json({ error: 'Could not save the slot.' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'create_direct') {
      const brandName = String(body.brandName || '').trim()
      const placement = String(body.placement || '')
      if (brandName.length < 2) return NextResponse.json({ error: 'Brand name is required.' }, { status: 400 })
      if (!isAdPlacement(placement)) return NextResponse.json({ error: 'Choose a placement.' }, { status: 400 })
      const websiteUrl = String(body.websiteUrl || '').trim()
      if (websiteUrl && !/^https?:\/\//.test(websiteUrl)) return NextResponse.json({ error: 'The website link must start with http(s)://' }, { status: 400 })
      // monthly_rate is stored in pounds, matching the Stripe webhook and
      // sponsored-ad-confirm, which both write monthly_pence / 100.
      const monthlyRate = Math.round(Number(body.monthlyRate))
      if (body.monthlyRate !== undefined && String(body.monthlyRate).trim() !== '' && (!Number.isFinite(monthlyRate) || monthlyRate < 0)) {
        return NextResponse.json({ error: 'The monthly rate must be a positive number of pounds.' }, { status: 400 })
      }
      const { data: advert, error } = await admin.from('ad_placements').insert({
        brand_name: brandName,
        tagline: String(body.tagline || '').trim().slice(0, 160) || null,
        website_url: websiteUrl || null,
        logo_url: String(body.logoUrl || '').trim() || null,
        contact_email: String(body.contactEmail || '').trim() || null,
        placement,
        monthly_rate: String(body.monthlyRate ?? '').trim() !== '' && Number.isFinite(monthlyRate) && monthlyRate > 0 ? monthlyRate : null,
        status: 'active',
        payment_status: 'direct',
        review_status: 'approved',
        source: 'direct',
        start_date: String(body.startDate || '').trim() || new Date().toISOString().slice(0, 10),
        end_date: String(body.endDate || '').trim() || null,
        approved_at: now,
        updated_at: now,
      }).select('*').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, advert })
    }

    if (action === 'advert_status') {
      const id = String(body.id || '')
      const status = String(body.status || '')
      if (!id || !['active', 'paused', 'ended'].includes(status)) return NextResponse.json({ error: 'Invalid advert status.' }, { status: 400 })
      const { error } = await admin.from('ad_placements').update({ status, updated_at: now }).eq('id', id)
      if (error) return NextResponse.json({ error: 'Could not update the advert.' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not save.' }, { status: 500 })
  }
}
