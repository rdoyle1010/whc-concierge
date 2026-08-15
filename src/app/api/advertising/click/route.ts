import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const admin = createAdminClient()
  const { data } = await admin.from('ad_placements')
    .select('id, website_url, click_count')
    .eq('id', id)
    .eq('status', 'active')
    .eq('payment_status', 'paid')
    .eq('review_status', 'approved')
    .maybeSingle()
  if (!data?.website_url) return NextResponse.redirect(new URL('/', req.url))
  try {
    const target = new URL(data.website_url)
    if (target.protocol !== 'https:') throw new Error('Unsafe advert URL')
    await admin.from('ad_placements').update({ click_count: (data.click_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', data.id)
    return NextResponse.redirect(target, 307)
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

