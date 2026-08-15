import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdPlacement } from '@/lib/advertising'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement')
  if (!isAdPlacement(placement)) return NextResponse.json({ advert: null })
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await admin.from('ad_placements')
    .select('id, brand_name, tagline, logo_url, placement, impression_count')
    .eq('placement', placement)
    .eq('status', 'active')
    .eq('payment_status', 'paid')
    .eq('review_status', 'approved')
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('impression_count', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ advert: null })
  await admin.from('ad_placements').update({ impression_count: (data.impression_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', data.id)
  return NextResponse.json({ advert: { id: data.id, brand_name: data.brand_name, tagline: data.tagline, logo_url: data.logo_url, placement: data.placement } })
}

