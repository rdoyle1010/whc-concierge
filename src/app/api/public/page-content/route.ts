import { NextRequest, NextResponse } from 'next/server'
import { getPublicPageContent, getPublicPagesContent } from '@/lib/public-page-content-server'
import { PUBLIC_PAGE_SLUGS, type PublicPageSlug } from '@/lib/public-page-content'

export async function GET(req: NextRequest) {
  const draft = req.nextUrl.searchParams.get('draft') === '1'

  // The questions, asked for by name rather than by page slug, because they
  // are not a page: they are a list of lists that one page happens to render.
  // Served from here rather than from /api/public-pages so the FAQ preview
  // works the same way every other page's does, and so the cached public
  // endpoint stays cached.
  if (req.nextUrl.searchParams.get('part') === 'faq') {
    const content = await getPublicPagesContent(draft)
    return NextResponse.json({ faq: content.faq })
  }

  const slug = req.nextUrl.searchParams.get('slug') as PublicPageSlug | null
  if (!slug || !PUBLIC_PAGE_SLUGS.includes(slug)) return NextResponse.json({ error: 'Unknown page' }, { status: 400 })
  const page = await getPublicPageContent(slug, draft)
  return NextResponse.json({ page })
}
