import { NextRequest, NextResponse } from 'next/server'
import { getCommercialSetting } from '@/lib/commercial-settings'

export async function GET(req: NextRequest) {
  try {
    const product = req.nextUrl.searchParams.get('product') || ''
    if (!product) return NextResponse.json({ error: 'Missing product' }, { status: 400 })
    const setting = await getCommercialSetting(product)
    if (!setting || !setting.is_active) return NextResponse.json({ error: 'Product unavailable' }, { status: 404 })
    return NextResponse.json({ setting })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load product' }, { status: 500 })
  }
}
