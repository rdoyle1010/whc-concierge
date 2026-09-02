import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cloneDefaultWebsiteContent,
  parseWebsiteContent,
  WEBSITE_DRAFT_KEY,
  WEBSITE_PUBLISHED_KEY,
  type WebsiteContent,
} from '@/lib/site-content'

type LegacyImage = {
  slot: string
  image_url: string | null
  heading: string | null
  subtext: string | null
  sort_order: number | null
}

function applyLegacyImages(content: WebsiteContent, rows: LegacyImage[]): WebsiteContent {
  const next = JSON.parse(JSON.stringify(content)) as WebsiteContent
  const heroes = rows
    .filter(row => row.slot.startsWith('hero_') && row.image_url)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  if (heroes.length) {
    next.hero.slides = heroes.slice(0, 8).map((row, index) => ({
      image: {
        url: row.image_url || next.hero.slides[index]?.image.url || '',
        alt: row.heading || next.hero.slides[index]?.image.alt || 'Talent House Collective',
        focalX: 50,
        focalY: 50,
      },
      eyebrow: index === 0 ? 'Talent House Collective' : 'Why Talent House Collective',
      heading: row.heading || next.hero.slides[index]?.heading || '',
      text: row.subtext || next.hero.slides[index]?.text || '',
    }))
  }

  const bySlot = new Map(rows.map(row => [row.slot, row]))
  const how = bySlot.get('howitworks_1')
  if (how?.image_url) next.howItWorks.image.url = how.image_url
  const cta = bySlot.get('cta_bg')
  if (cta?.image_url) next.cta.background.url = cta.image_url
  next.roles.images.forEach((item, index) => {
    const row = bySlot.get('featured_' + (index + 1))
    if (row?.image_url) item.url = row.image_url
  })
  return next
}

async function readWebsiteContent(key: string): Promise<WebsiteContent> {
  try {
    const admin = createAdminClient()
    const [{ data: storedRows }, { data: legacyRows }] = await Promise.all([
      admin.from('platform_config').select('value').eq('key', key).limit(1),
      admin.from('site_images').select('slot, image_url, heading, subtext, sort_order').order('sort_order'),
    ])

    const stored = storedRows?.[0]
    if (stored?.value) return parseWebsiteContent(stored.value)
    return applyLegacyImages(cloneDefaultWebsiteContent(), (legacyRows || []) as LegacyImage[])
  } catch {
    return cloneDefaultWebsiteContent()
  }
}

const getCachedPublishedWebsiteContent = unstable_cache(
  () => readWebsiteContent(WEBSITE_PUBLISHED_KEY),
  ['website-content-published-v1'],
  // Tagged so the admin publish action can revalidate it instantly instead
  // of waiting out the 60-second window.
  { revalidate: 60, tags: ['website-content'] }
)

export async function getWebsiteContent(useDraft = false): Promise<WebsiteContent> {
  if (useDraft) return readWebsiteContent(WEBSITE_DRAFT_KEY)
  return getCachedPublishedWebsiteContent()
}
