import { z } from 'zod'
// Moved out so the browser can read the defaults without the validator;
// re-exported so nothing that already imports them has to change.
import { DEFAULT_PUBLIC_PAGES_CONTENT, defaultEditorialBand } from './public-page-content-values'
export { DEFAULT_PUBLIC_PAGES_CONTENT }
import { normaliseLegacySiteLinks } from '@/lib/site-content'

export const PUBLIC_PAGES_DRAFT_KEY = 'public_pages_content_draft_v1'
export const PUBLIC_PAGES_PUBLISHED_KEY = 'public_pages_content_published_v1'
export const PUBLIC_PAGES_HISTORY_KEY = 'public_pages_content_history_v1'

export const PUBLIC_PAGE_SLUGS = ['properties', 'agency', 'residency', 'pricing', 'coming-soon'] as const
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
