import { z } from 'zod'
// Moved out so the browser can read the defaults without the validator;
// re-exported so nothing that already imports them has to change.
import { DEFAULT_PUBLIC_PAGES_CONTENT, defaultEditorialBand } from './public-page-content-values'
export { DEFAULT_PUBLIC_PAGES_CONTENT }
import { normaliseLegacySiteLinks } from '@/lib/site-content'

export const PUBLIC_PAGES_DRAFT_KEY = 'public_pages_content_draft_v1'
export const PUBLIC_PAGES_PUBLISHED_KEY = 'public_pages_content_published_v1'
export const PUBLIC_PAGES_HISTORY_KEY = 'public_pages_content_history_v1'

export const PUBLIC_PAGE_SLUGS = [
  'properties', 'agency', 'residency', 'pricing', 'coming-soon',
  // Added once the site had outgrown the five it started with. These are the
  // pages a stranger reads before deciding whether to take this seriously, and
  // until now only a deploy could change a word of them.
  'about', 'advertise', 'how-to-use', 'academy', 'agency-cover',
] as const

/**
 * What each page actually renders, so the editor only offers what exists.
 *
 * This map is the answer to the complaint that started it: an editor full of
 * boxes that change nothing is worse than no editor, because somebody writes
 * something, saves it, looks at the page and concludes the whole screen is
 * broken. The five newer pages have text heroes and no hero photograph and no
 * three-block band, so they get three fields and no image picker.
 *
 * A test holds this against what the pages consume. If a page starts rendering
 * its blocks, or stops, the map is wrong until somebody changes it here.
 */
export type PageSections = { heroImage: boolean; blocks: boolean }

export const PAGE_SECTIONS: Record<PublicPageSlug, PageSections> = {
  properties: { heroImage: true, blocks: true },
  agency: { heroImage: true, blocks: true },
  residency: { heroImage: true, blocks: true },
  // Pricing has offered three section editors since it was built and has
  // never rendered one of them. Not something this change broke: it was live,
  // and it is exactly the complaint that started all of this. Recorded here
  // rather than fixed by adding three sections nobody designed, so the boxes
  // stop being offered until somebody decides the page wants them.
  pricing: { heroImage: true, blocks: false },
  'coming-soon': { heroImage: true, blocks: true },
  about: { heroImage: false, blocks: false },
  advertise: { heroImage: false, blocks: false },
  'how-to-use': { heroImage: false, blocks: false },
  academy: { heroImage: false, blocks: false },
  'agency-cover': { heroImage: false, blocks: false },
}
export type PublicPageSlug = typeof PUBLIC_PAGE_SLUGS[number]

const text = z.string().trim().max(6000)
const link = z.string().trim().max(2048)
const imageSchema = z.object({ url: link, alt: text, focalX: z.number().min(0).max(100), focalY: z.number().min(0).max(100) })
const labelledImageSchema = imageSchema.extend({ label: text })
const blockSchema = z.object({ eyebrow: text, heading: text, text, image: imageSchema, visible: z.boolean() })
const pageSchema = z.object({
  label: text,
  hero: z.object({ eyebrow: text, heading: text, text, image: imageSchema }),
  blocks: z.array(blockSchema).length(3),
})


export const PublicPagesContentSchema = z.object({
  version: z.literal(1),
  editorialBand: z.array(labelledImageSchema).length(4).default(defaultEditorialBand),
  pages: z.object({
    properties: pageSchema,
    agency: pageSchema,
    residency: pageSchema,
    pricing: pageSchema,
    'coming-soon': pageSchema,
    about: pageSchema,
    advertise: pageSchema,
    'how-to-use': pageSchema,
    academy: pageSchema,
    'agency-cover': pageSchema,
  }),
})

export type PublicPagesContent = z.infer<typeof PublicPagesContentSchema>
export type PublicPageContent = PublicPagesContent['pages'][PublicPageSlug]
export type PublicPagesHistoryEntry = { id: string; publishedAt: string; publishedBy?: string; content: PublicPagesContent }


export function cloneDefaultPublicPagesContent(): PublicPagesContent {
  return JSON.parse(JSON.stringify(DEFAULT_PUBLIC_PAGES_CONTENT)) as PublicPagesContent
}

export function parsePublicPagesContent(value: unknown): PublicPagesContent {
  const raw = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return null } })() : value
  const parsed = PublicPagesContentSchema.safeParse(raw)
  return parsed.success ? normaliseLegacySiteLinks(parsed.data) : cloneDefaultPublicPagesContent()
}
