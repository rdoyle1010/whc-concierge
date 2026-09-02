import type { CSSProperties } from 'react'
import { z } from 'zod'
// Moved out so the browser can have them without the validator; re-exported
// so nothing that already imports them has to change.
import { DEFAULT_LOGO, DEFAULT_PANELS, DEFAULT_WEBSITE_CONTENT, safeLogoUrl, websiteCssVariables } from './site-content-values'
export { DEFAULT_LOGO, DEFAULT_PANELS, DEFAULT_WEBSITE_CONTENT, safeLogoUrl, websiteCssVariables }

// The canonical public origin. Everything user-facing links here.
export const SITE_ORIGIN = 'https://talenthousecollective.co.uk'

export const WEBSITE_DRAFT_KEY = 'website_content_draft_v1'
export const WEBSITE_PUBLISHED_KEY = 'website_content_published_v1'
export const WEBSITE_HISTORY_KEY = 'website_content_history_v1'

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const text = z.string().trim().max(4000)
const link = z.string().trim().max(2048)

const imageSchema = z.object({
  url: link,
  alt: text,
  focalX: z.number().min(0).max(100),
  focalY: z.number().min(0).max(100),
})

const calloutSchema = z.object({ eyebrow: text, heading: text, text, buttonLabel: text, buttonHref: link })

// Shipped as the default so a site that has never touched the brand editor
// keeps the bundled artwork. Uploading a logo in admin replaces it.

// Both panels ship as plain charcoal, exactly as they render today. Nothing
// changes on the live site until an administrator turns a panel on.

// The header lockup. 'fill' crops the artwork to the header box, which is
// what the supplied WHC block artwork wants; 'contain' shows a whole logo on
// a clear background, which is what an uploaded transparent PNG wants.
const logoSchema = z.object({
  url: link,
  alt: text,
  fit: z.enum(['fill', 'contain']),
})

// The platform's large charcoal panels are inventory. Each one can stay a
// plain brand panel, carry a picture, or be sold to a sponsor - and a sold
// panel that has no live advert falls back to the picture, then to charcoal,
// so the space is never empty.
const panelSchema = z.object({
  mode: z.enum(['brand', 'image', 'advert']),
  image: imageSchema,
  overlay: z.number().min(0).max(100),
})

export const WebsiteContentSchema = z.object({
  version: z.literal(1),
  brand: z.object({
    headingFont: z.enum(['modern', 'editorial', 'classic']),
    bodyFont: z.enum(['system', 'clean', 'friendly']),
    accent: hex,
    ink: hex,
    background: hex,
    surface: hex,
    buttonStyle: z.enum(['square', 'soft', 'pill']),
    spacing: z.enum(['compact', 'balanced', 'airy']),
    logo: logoSchema.default(DEFAULT_LOGO),
  }),
  navigation: z.object({
    jobs: text, agency: text, academy: text, residency: text, blog: text,
    talentSignIn: text, employerSignIn: text,
  }),
  hero: z.object({
    slides: z.array(z.object({ image: imageSchema, eyebrow: text, heading: text, text })).min(1).max(8),
    primaryLabel: text, primaryHref: link, secondaryLabel: text, secondaryHref: link,
  }),
  proof: z.object({ items: z.array(text).min(1).max(6) }),
  howItWorks: z.object({ eyebrow: text, heading: text, image: imageSchema }),
  product: z.object({
    eyebrow: text, heading: text, intro: text,
    cards: z.array(z.object({ label: text, text })).length(3),
  }),
  trust: z.object({ eyebrow: text, items: z.array(text).min(1).max(10) }),
  roles: z.object({ eyebrow: text, heading: text, linkLabel: text, images: z.array(imageSchema).length(3) }),
  cta: z.object({ background: imageSchema, talent: calloutSchema, employer: calloutSchema }),
  services: z.object({ cards: z.array(calloutSchema).length(3) }),
  testimonials: z.object({ eyebrow: text, heading: text, linkLabel: text }),
  footer: z.object({ copyright: text, staffLabel: text }),
  panels: z.object({
    homepageCta: panelSchema,
    authPanel: panelSchema,
    // .default() on each one, because content saved before these existed has
    // to keep parsing - a stored record predating a field is the normal case,
    // not the exception.
    intelligenceHero: panelSchema.default(DEFAULT_PANELS.intelligenceHero),
    intelligenceJournal: panelSchema.default(DEFAULT_PANELS.intelligenceJournal),
    agencyProfessional: panelSchema.default(DEFAULT_PANELS.agencyProfessional),
  }).default(DEFAULT_PANELS),
  sections: z.array(z.object({
    id: z.enum(['proof', 'howItWorks', 'product', 'trust', 'roles', 'cta', 'services', 'testimonials']),
    visible: z.boolean(),
  })).length(8),
})

export type WebsiteContent = z.infer<typeof WebsiteContentSchema>
export type WebsiteSectionId = WebsiteContent['sections'][number]['id']
export type WebsiteHistoryEntry = { id: string; publishedAt: string; publishedBy?: string; content: WebsiteContent }

export function cloneDefaultWebsiteContent(): WebsiteContent {
  return JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT)) as WebsiteContent
}

// The homepage brand lives in the database, so a saved palette outlives a
// deploy. These are the navy-era values: whenever one is still stored we
// swap in the charcoal default, so the live site moves with the code and
// no admin has to republish to pick the new palette up.
const LEGACY_BRAND: Record<'accent' | 'ink' | 'background' | 'surface', string[]> = {
  // Navy era, then the warm charcoal that replaced it. Both move to grey.
  accent: ['#0b2f4d', '#07243b', '#123f64', '#1c1b1a'],
  ink: ['#10283b', '#102838', '#1c1b1a'],
  background: ['#ffffff', '#f7f5f2'],
  surface: ['#f5f5f5', '#f5f6f8', '#f7f8fa', '#f3f0eb'],
}

// Website content saved before the move to talenthousecollective.co.uk can
// still carry absolute links on the old host. Rewrite them on read so stored
// content follows the canonical domain without anyone republishing.
const LEGACY_SITE_ORIGINS = [
  'https://talent.wellnesshousecollective.co.uk',
  'http://talent.wellnesshousecollective.co.uk',
]

export function normaliseLegacySiteLinks<T>(value: T): T {
  let json = JSON.stringify(value)
  for (const origin of LEGACY_SITE_ORIGINS) {
    json = json.split(origin).join(SITE_ORIGIN)
  }
  return JSON.parse(json) as T
}

function normaliseLegacyBrand(content: WebsiteContent): WebsiteContent {
  const defaults = DEFAULT_WEBSITE_CONTENT.brand
  for (const key of Object.keys(LEGACY_BRAND) as (keyof typeof LEGACY_BRAND)[]) {
    if (LEGACY_BRAND[key].includes(content.brand[key].trim().toLowerCase())) {
      content.brand[key] = defaults[key]
    }
  }
  return content
}

export function parseWebsiteContent(value: unknown): WebsiteContent {
  const raw = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return null } })() : value
  const parsed = WebsiteContentSchema.safeParse(raw)
  return parsed.success
    ? normaliseLegacySiteLinks(normaliseLegacyBrand(parsed.data))
    : cloneDefaultWebsiteContent()
}

// A logo URL reaches the page inside a CSS url() and an <img src>, so a stray
// quote or bracket would break out of both. Anything that is not a plain
// relative path or http(s) URL falls back to the bundled artwork.

