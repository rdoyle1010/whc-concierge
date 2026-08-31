import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdPlacement } from '@/lib/advertising'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement')
  if (!isAdPlacement(placement)) return NextResponse.json({ advert: null })
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  // A slot renders nothing unless admin has switched it on. Missing rows are
  // treated as disabled, so new slots are hidden until deliberately opened.
  const { data: slot } = await admin.from('ad_slot_settings')
    .select('enabled, pinned_placement_id').eq('slot_key', placement).maybeSingle()
  if (!slot?.enabled) return NextResponse.json({ advert: null })

  // A pinned advert (usually a direct deal placed by admin) wins the slot.
  // It must still meet the same bar as rotation: paid or direct, approved,
  // active and inside its start/end date window.
  let data: any = null
  if (slot.pinned_placement_id) {
    const { data: pinned } = await admin.from('ad_placements')
      .select('id, brand_name, tagline, logo_url, placement, impression_count, status, review_status, payment_status, start_date, end_date')
      .eq('id', slot.pinned_placement_id).maybeSingle()
    const withinWindow = Boolean(pinned && pinned.start_date && pinned.start_date <= today && (!pinned.end_date || pinned.end_date >= today))
    if (pinned && pinned.status === 'active' && pinned.review_status === 'approved'
      && ['paid', 'direct'].includes(pinned.payment_status) && withinWindow) data = pinned
  }
  if (!data) {
    const { data: found } = await admin.from('ad_placements')
      .select('id, brand_name, tagline, logo_url, placement, impression_count')
      .eq('placement', placement)
      .eq('status', 'active')
      .in('payment_status', ['paid', 'direct'])
      .eq('review_status', 'approved')
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('impression_count', { ascending: true })
      .limit(1)
      .maybeSingle()
    data = found
  }
  if (!data) return NextResponse.json({ advert: null })
  await admin.from('ad_placements').update({ impression_count: (data.impression_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', data.id)
  return NextResponse.json({ advert: { id: data.id, brand_name: data.brand_name, tagline: data.tagline, logo_url: data.logo_url, placement: data.placement } })
}

