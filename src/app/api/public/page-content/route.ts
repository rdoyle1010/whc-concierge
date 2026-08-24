import { NextRequest, NextResponse } from 'next/server'
import { getPublicPageContent } from '@/lib/public-page-content-server'
import { PUBLIC_PAGE_SLUGS, type PublicPageSlug } from '@/lib/public-page-content'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') as PublicPageSlug | null
  if (!slug || !PUBLIC_PAGE_SLUGS.includes(slug)) return NextResponse.json({ error: 'Unknown page' }, { status: 400 })
  const draft = req.nextUrl.searchParams.get('draft') === '1'
  const page = await getPublicPageContent(slug, draft)
  return NextResponse.json({ page })
}
