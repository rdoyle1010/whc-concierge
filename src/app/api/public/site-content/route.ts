import { NextResponse } from 'next/server'
import { getWebsiteContent } from '@/lib/site-content-server'

// Published Website & Brand content for client components (Navbar, Footer)
// on pages that don't fetch it server-side, so admin edits to the menu,
// footer, brand and sellable panels reach every page - not just the homepage.

export const revalidate = 60

export async function GET() {
  const content = await getWebsiteContent(false)
  return NextResponse.json(
    { navigation: content.navigation, footer: content.footer, brand: content.brand, panels: content.panels },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  )
}
