import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cloneDefaultPublicPagesContent,
  parsePublicPagesContent,
  PUBLIC_PAGES_DRAFT_KEY,
  PUBLIC_PAGES_PUBLISHED_KEY,
  type PublicPagesContent,
  type PublicPageSlug,
} from '@/lib/public-page-content'

export const PUBLIC_PAGES_CACHE_TAG = 'public-pages-content-published'

async function readPublicPagesContent(key: string): Promise<PublicPagesContent> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('platform_config').select('value').eq('key', key).limit(1)
    const stored = data?.[0]?.value
    return stored ? parsePublicPagesContent(stored) : cloneDefaultPublicPagesContent()
  } catch {
    return cloneDefaultPublicPagesContent()
  }
}

const getCachedPublishedContent = unstable_cache(
  () => readPublicPagesContent(PUBLIC_PAGES_PUBLISHED_KEY),
  ['public-pages-content-published-v1'],
  // An hour, because saving a page in admin drops this tag on the same request.
  // Five minutes was a second safety net under an invalidation that already
  // works, and it held /about, /agency/about and /coming-soon to a five-minute
  // window they could not get out of.
  { revalidate: 3600, tags: [PUBLIC_PAGES_CACHE_TAG] }
)

export async function getPublicPagesContent(useDraft = false): Promise<PublicPagesContent> {
  if (useDraft) return readPublicPagesContent(PUBLIC_PAGES_DRAFT_KEY)
  return getCachedPublishedContent()
}

export async function getPublicPageContent(slug: PublicPageSlug, useDraft = false) {
  const content = await getPublicPagesContent(useDraft)
  return content.pages[slug]
}
