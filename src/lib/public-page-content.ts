import { z } from 'zod'
// Moved out so the browser can read the defaults without the validator;
// re-exported so nothing that already imports them has to change.
import { DEFAULT_PUBLIC_PAGES_CONTENT, DEFAULT_FAQ_SECTIONS, defaultEditorialBand } from './public-page-content-values'
export { DEFAULT_PUBLIC_PAGES_CONTENT, DEFAULT_FAQ_SECTIONS }
import { normaliseLegacySiteLinks } from '@/lib/site-content'

export const PUBLIC_PAGES_DRAFT_KEY = 'public_pages_content_draft_v1'
export const PUBLIC_PAGES_PUBLISHED_KEY = 'public_pages_content_published_v1'
export const PUBLIC_PAGES_HISTORY_KEY = 'public_pages_content_history_v1'

export const PUBLIC_PAGE_SLUGS = [
  'properties', 'agency', 'residency', 'pricing', 'coming-soon',
  // Added once the site had outgrown the five it started with. These are the
  // pages a stranger reads before deciding whether to take this seriously, and
  // until now only a deploy could change a word of them.
  'about', 'advertise', 'how-to-use', 'academy', 'agency-cover', 'contact',
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
/**
 * What each page is called and where it lives.
 *
 * Kept here because there were two copies, one on the page editor and one on
 * the Pictures screen, and the second was typed as Record<string, string> so
 * nothing complained when six pages were added and only one copy was updated.
 * The Pictures screen quietly rendered them with no heading at all.
 */
export const PAGE_NAMES: Record<PublicPageSlug, string> = {
  properties: 'Properties', agency: 'Agency', residency: 'Residency',
  pricing: 'Pricing', 'coming-soon': 'Coming Soon', about: 'About',
  advertise: 'Advertise', 'how-to-use': 'How It Works', academy: 'Academy',
  'agency-cover': 'Agency Cover', contact: 'Contact',
}

export const PAGE_PATHS: Record<PublicPageSlug, string> = {
  properties: '/properties', agency: '/agency/about', residency: '/residency',
  pricing: '/pricing', 'coming-soon': '/coming-soon', about: '/about',
  advertise: '/advertise', 'how-to-use': '/how-to-use', academy: '/academy',
  'agency-cover': '/agency', contact: '/contact',
}

/**
 * What a page actually renders, and therefore what it may be asked about.
 *
 * `blocks` is a count rather than a flag. It was a boolean, and a boolean can
 * only say "some", so a page that rendered one section still offered three
 * editors - which is precisely the complaint recorded against Pricing below:
 * boxes that take wording and a photograph and put them nowhere. A number
 * cannot drift from the truth as quietly.
 */
export type PageSections = { heroImage: boolean; blocks: number }

export const PAGE_SECTIONS: Record<PublicPageSlug, PageSections> = {
  properties: { heroImage: true, blocks: 3 },
  agency: { heroImage: true, blocks: 3 },
  residency: { heroImage: true, blocks: 3 },
  // Pricing has offered three section editors since it was built and has
  // never rendered one of them. Not something this change broke: it was live,
  // and it is exactly the complaint that started all of this. Recorded here
  // rather than fixed by adding three sections nobody designed, so the boxes
  // stop being offered until somebody decides the page wants them.
  pricing: { heroImage: true, blocks: 0 },
  'coming-soon': { heroImage: true, blocks: 3 },
  // The founder section is the first block. It was hardcoded prose and a
  // hardcoded file path - /images/founder-rebecca.jpg, which has never existed
  // in this repository - so the About page showed a grey monogram and there was
  // no upload slot anywhere on the platform that could fix it.
  about: { heroImage: false, blocks: 1 },
  advertise: { heroImage: false, blocks: 0 },
  'how-to-use': { heroImage: false, blocks: 0 },
  academy: { heroImage: false, blocks: 0 },
  'agency-cover': { heroImage: false, blocks: 0 },
  contact: { heroImage: false, blocks: 0 },
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


// Questions and answers, which are a list of lists rather than a hero and
// three blocks. Forcing them into the page shape was the reason FAQ was left
// out of the first pass, and the reason it is a separate key now: a screen
// that lets somebody edit three of their twenty-three questions is not an
// improvement on a screen that lets them edit none.
const faqItemSchema = z.object({ question: text, answer: text })
const faqSectionSchema = z.object({ title: text, items: z.array(faqItemSchema).max(40) })

export const PublicPagesContentSchema = z.object({
  version: z.literal(1),
  editorialBand: z.array(labelledImageSchema).length(4).default(defaultEditorialBand),
  faq: z.array(faqSectionSchema).max(12).default(() => DEFAULT_FAQ_SECTIONS),
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
    contact: pageSchema,
  }),
})

export type PublicPagesContent = z.infer<typeof PublicPagesContentSchema>
export type PublicPageContent = PublicPagesContent['pages'][PublicPageSlug]
export type PublicPagesHistoryEntry = { id: string; publishedAt: string; publishedBy?: string; content: PublicPagesContent }


export function cloneDefaultPublicPagesContent(): PublicPagesContent {
  return JSON.parse(JSON.stringify(DEFAULT_PUBLIC_PAGES_CONTENT)) as PublicPagesContent
}

/**
 * Fill the gaps rather than throw the lot away.
 *
 * This is the fix for a bug I caused. Stored content was validated strictly
 * and, on any failure, discarded in favour of the code defaults. That was
 * survivable while the shape never changed. The moment six pages and a list of
 * questions were added to the schema, every draft and every published version
 * saved before that stopped validating - so every read returned the defaults,
 * and the owner watched her photographs revert to stock every time she opened
 * the screen. Nothing said why. The editor simply showed old pictures again.
 *
 * Adding a field must never be able to erase somebody's work. Stored values
 * now sit on top of the defaults, key by key, so anything missing fills itself
 * in and anything present survives.
 */
function fillGaps(stored: any, defaults: any): any {
  if (Array.isArray(defaults)) {
    // A stored array wins outright. Merging element by element would quietly
    // resurrect a question she deleted, or a fifth footer tile.
    return Array.isArray(stored) ? stored : defaults
  }
  if (defaults && typeof defaults === 'object') {
    if (!stored || typeof stored !== 'object') return defaults
    const merged: any = { ...defaults }
    for (const key of Object.keys(defaults)) merged[key] = fillGaps(stored[key], defaults[key])
    // Anything stored that the defaults no longer know about is dropped, which
    // is what removing a page from the schema should mean.
    return merged
  }
  return stored === undefined || stored === null ? defaults : stored
}

export function parsePublicPagesContent(value: unknown): PublicPagesContent {
  const raw = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return null } })() : value

  const parsed = PublicPagesContentSchema.safeParse(raw)
  if (parsed.success) return normaliseLegacySiteLinks(parsed.data)

  // Second attempt, with the gaps filled from the defaults. A version saved
  // before a field existed is not corrupt, it is just older than the schema.
  const repaired = PublicPagesContentSchema.safeParse(fillGaps(raw, DEFAULT_PUBLIC_PAGES_CONTENT))
  if (repaired.success) return normaliseLegacySiteLinks(repaired.data)

  // Genuinely unreadable. Now the defaults are the right answer.
  console.error('[public pages] stored content could not be read even after filling gaps')
  return cloneDefaultPublicPagesContent()
}
