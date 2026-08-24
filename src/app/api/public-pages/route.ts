import { NextResponse } from 'next/server'
import { getPublicPagesContent } from '@/lib/public-page-content-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const content = await getPublicPagesContent(false)
  return NextResponse.json(
    { content },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
