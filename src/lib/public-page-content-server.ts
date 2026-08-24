import { createAdminClient } from '@/lib/supabase/admin'
import {
  cloneDefaultPublicPagesContent,
  parsePublicPagesContent,
  PUBLIC_PAGES_DRAFT_KEY,
  PUBLIC_PAGES_PUBLISHED_KEY,
  type PublicPagesContent,
  type PublicPageSlug,
} from '@/lib/public-page-content'

export async function getPublicPagesContent(useDraft = false): Promise<PublicPagesContent> {
  try {
    const admin = createAdminClient()
    const key = useDraft ? PUBLIC_PAGES_DRAFT_KEY : PUBLIC_PAGES_PUBLISHED_KEY
    const { data } = await admin.from('platform_config').select('value').eq('key', key).limit(1)
    const stored = data?.[0]?.value
    return stored ? parsePublicPagesContent(stored) : cloneDefaultPublicPagesContent()
  } catch {
    return cloneDefaultPublicPagesContent()
  }
}

export async function getPublicPageContent(slug: PublicPageSlug, useDraft = false) {
  const content = await getPublicPagesContent(useDraft)
  return content.pages[slug]
}
