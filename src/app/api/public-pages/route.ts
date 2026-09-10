import { NextResponse } from 'next/server'
import { getPublicPagesContent } from '@/lib/public-page-content-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const content = await getPublicPagesContent(false)
  // Published, public, and identical for every visitor, so no-store was
  // costing a cold function call on every page load of the site to fetch four
  // image URLs - which is most of the delay before the band settles.
  //
  // A short private window plus stale-while-revalidate means the second page
  // a visitor opens has the band immediately, and a change published in admin
  // still reaches them within a minute. The cache tag remains the thing that
  // makes a publish land on the server side.
  return NextResponse.json(
    { content },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
