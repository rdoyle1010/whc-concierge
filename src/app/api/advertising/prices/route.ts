import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AD_PLACEMENTS } from '@/lib/advertising'

// Public price list for advert placements. Stripe charges the price held in
// commercial_settings (editable in /admin/settings), so every page that shows
// a price reads it from here rather than the hardcoded AD_PLACEMENTS numbers.
// Falls back to AD_PLACEMENTS monthlyPence for any placement without an
// active commercial_settings row.

export const revalidate = 60

export async function GET() {
  const prices: Record<string, number> = {}
  for (const [key, config] of Object.entries(AD_PLACEMENTS)) prices[key] = config.monthlyPence
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('commercial_settings')
      .select('product_key, price_pence, is_active')
      .like('product_key', 'ad_%')
      .eq('is_active', true)
    for (const row of data || []) {
      const placementId = String(row.product_key || '').replace(/^ad_/, '')
      const pence = Number(row.price_pence)
      if (placementId in prices && Number.isFinite(pence) && pence > 0) prices[placementId] = pence
    }
  } catch {
    // On any lookup failure the hardcoded fallback prices are returned.
  }
  return NextResponse.json({ prices }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } })
}
