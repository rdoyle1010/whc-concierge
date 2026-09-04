import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdPlacement } from '@/lib/advertising'

export const dynamic = 'force-dynamic'

// The columns that arrive with 20260901180000_advert_creative.sql. Read
// separately so a slot keeps serving before that migration is applied.
const CREATIVE_COLUMNS = 'media_url, media_type, cta_label, rotation_weight, sort_order'
const BASE_COLUMNS = 'id, brand_name, tagline, logo_url, placement, impression_count, status, review_status, payment_status, start_date, end_date'

type Advert = Record<string, any>

function isLive(advert: Advert | null, today: string) {
  if (!advert) return false
  // A null start date means "as soon as it is approved", not "never". The
  // previous query required start_date <= today, and a self-serve advert is
  // written with a null start date at checkout - so a paid advert could never
  // win a slot, however many times an administrator activated it.
  const started = !advert.start_date || advert.start_date <= today
  const notEnded = !advert.end_date || advert.end_date >= today
  return advert.status === 'active'
    && advert.review_status === 'approved'
    && ['paid', 'direct'].includes(String(advert.payment_status))
    && started && notEnded
}

function present(advert: Advert) {
  const declared = advert.media_type === 'video' || advert.media_type === 'image' ? advert.media_type : 'logo'
  return {
    id: advert.id,
    brand_name: advert.brand_name,
    tagline: advert.tagline,
    logo_url: advert.logo_url,
    placement: advert.placement,
    media_url: advert.media_url || null,
    media_type: advert.media_url ? declared : 'logo',
    cta_label: advert.cta_label || 'Discover more',
  }
}

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement')
  if (!isAdPlacement(placement)) return NextResponse.json({ adverts: [], advert: null })
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // A slot renders nothing unless admin has switched it on. A missing row is
  // treated as disabled, so a new slot stays hidden until deliberately opened.
  let slot: any = null
  const withCarousel = await admin.from('ad_slot_settings')
    .select('enabled, pinned_placement_id, carousel_size, rotate_seconds').eq('slot_key', placement).maybeSingle()
  if (withCarousel.error) {
    const fallback = await admin.from('ad_slot_settings')
      .select('enabled, pinned_placement_id').eq('slot_key', placement).maybeSingle()
    slot = fallback.data
  } else {
    slot = withCarousel.data
  }
  if (!slot?.enabled) return NextResponse.json({ adverts: [], advert: null })

  const carouselSize = Math.max(1, Math.min(8, Number(slot.carousel_size) || 1))
  const rotateSeconds = Math.max(4, Math.min(60, Number(slot.rotate_seconds) || 8))

  async function readAdverts(): Promise<Advert[]> {
    const rich = await admin.from('ad_placements')
      .select(`${BASE_COLUMNS}, ${CREATIVE_COLUMNS}`)
      .eq('placement', placement)
      .eq('status', 'active')
      .in('payment_status', ['paid', 'direct'])
      .eq('review_status', 'approved')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('impression_count', { ascending: true })
      .limit(24)
    if (!rich.error) return (rich.data as unknown as Advert[]) || []

    // Before the creative migration runs, order by impressions alone.
    const plain = await admin.from('ad_placements')
      .select(BASE_COLUMNS)
      .eq('placement', placement)
      .eq('status', 'active')
      .in('payment_status', ['paid', 'direct'])
      .eq('review_status', 'approved')
      .order('impression_count', { ascending: true })
      .limit(24)
    return (plain.data as unknown as Advert[]) || []
  }

  const eligible = (await readAdverts()).filter(advert => isLive(advert, today))

  // A pinned advert - usually a direct deal placed by hand - leads the slot.
  let ordered = eligible
  if (slot.pinned_placement_id) {
    const pinned = eligible.find(advert => advert.id === slot.pinned_placement_id)
    if (pinned) ordered = [pinned, ...eligible.filter(advert => advert.id !== pinned.id)]
  }

  // Weighting, so a brand on the premium rate is seen more often than one on
  // the base rate. The list is expanded by weight and then de-duplicated in
  // order, which favours the heavier brands without ever starving a lighter
  // one out of the rotation entirely.
  const weighted: Advert[] = []
  for (const advert of ordered) {
    const weight = Math.max(1, Math.min(10, Number(advert.rotation_weight) || 1))
    for (let i = 0; i < weight; i++) weighted.push(advert)
  }
  const chosen: Advert[] = []
  const seen = new Set<string>()
  for (const advert of weighted) {
    if (seen.has(advert.id)) continue
    seen.add(advert.id)
    chosen.push(advert)
    if (chosen.length >= carouselSize) break
  }

  if (chosen.length === 0) return NextResponse.json({ adverts: [], advert: null })

  // One impression per advert actually returned. Best-effort: a failed count
  // must never cost a paying brand its placement.
  try {
    await Promise.allSettled(chosen.map(advert => admin.from('ad_placements')
      .update({ impression_count: (advert.impression_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', advert.id)))
  } catch { }

  const adverts = chosen.map(present)
  // `advert` is kept for any caller still reading the single-advert shape.
  return NextResponse.json({ adverts, advert: adverts[0], rotateSeconds })
}
