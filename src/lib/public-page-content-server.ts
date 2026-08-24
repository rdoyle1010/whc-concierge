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
  { revalidate: 60 }
)

export async function getPublicPagesContent(useDraft = false): Promise<PublicPagesContent> {
  if (useDraft) return readPublicPagesContent(PUBLIC_PAGES_DRAFT_KEY)
  return getCachedPublishedContent()
}

export async function getPublicPageContent(slug: PublicPageSlug, useDraft = false) {
  const content = await getPublicPagesContent(useDraft)
  return content.pages[slug]
}
