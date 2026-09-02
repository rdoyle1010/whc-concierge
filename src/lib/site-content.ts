import type { CSSProperties } from 'react'
import { z } from 'zod'

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
  sections: z.array(z.object({
    id: z.enum(['proof', 'howItWorks', 'product', 'trust', 'roles', 'cta', 'services', 'testimonials']),
    visible: z.boolean(),
  })).length(8),
})

export type WebsiteContent = z.infer<typeof WebsiteContentSchema>
export type WebsiteSectionId = WebsiteContent['sections'][number]['id']
export type WebsiteHistoryEntry = { id: string; publishedAt: string; publishedBy?: string; content: WebsiteContent }

const image = (url: string, alt: string): WebsiteContent['howItWorks']['image'] => ({ url, alt, focalX: 50, focalY: 50 })

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  version: 1,
  brand: {
    headingFont: 'modern', bodyFont: 'system', accent: '#1C1B1A', ink: '#1C1B1A',
    background: '#F7F5F2', surface: '#F3F0EB', buttonStyle: 'square', spacing: 'airy',
  },
  navigation: {
    jobs: 'Browse Roles', agency: 'Agency', academy: 'Academy', residency: 'Residency', blog: 'Journal',
    talentSignIn: 'Talent Sign In', employerSignIn: 'Hotel Sign In',
  },
  hero: {
    slides: [
      { image: image('https://images.unsplash.com/photo-1720678418766-2628e52f4634?w=1920&q=80&auto=format&fit=crop', 'Luxury spa interior'), eyebrow: 'WHC Concierge', heading: 'The professional platform for spa and wellness careers', text: 'Find exceptional people. Build better careers. Develop stronger spa businesses.' },
      { image: image('https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=1920&q=80&auto=format&fit=crop', 'Calm luxury treatment space'), eyebrow: 'Intelligent matching', heading: 'Precision matching, not guesswork', text: 'Skills, qualifications, brands, location and availability, weighted and scored - so both sides can see why a match is right.' },
      { image: image('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80&auto=format&fit=crop', 'Wellness treatment setting'), eyebrow: 'Verified by WHC', heading: 'Every profile tells the full story', text: 'Right-to-work, insurance and qualifications reviewed by WHC before the Verified badge is awarded.' },
    ],
    primaryLabel: 'Post a Role', primaryHref: '/register/employer',
    secondaryLabel: 'Join as a Professional', secondaryHref: '/register/talent',
  },
  proof: { items: ['Hand-picked professionals', 'Insurance verified', 'Five-star properties only'] },
  howItWorks: {
    eyebrow: 'How it works', heading: 'Three steps to your next chapter',
    image: image('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80&auto=format&fit=crop', 'Luxury spa treatment room'),
  },
  product: {
    eyebrow: 'Tools built for the industry', heading: 'See the product, not just the promise.',
    intro: 'A clear view of the profiles, matching and live opportunities available to professionals and employers.',
    cards: [
      { label: 'For employers', text: 'Browse vetted, agency-available professionals with clear rates, skills and experience.' },
      { label: 'Our matching', text: 'Skills, qualifications, brands, location and availability, weighted and scored - so both sides can see why a match is right.' },
      { label: 'For talent', text: 'Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.' },
    ],
  },
  trust: {
    eyebrow: 'Built for properties of this calibre',
    items: ['Country House Spas', 'Five-Star City Hotels', 'Destination Retreats', 'Private Estates', 'Boutique Wellness Clubs', 'Championship Golf Resorts'],
  },
  roles: {
    eyebrow: 'Latest opportunities', heading: 'Featured roles', linkLabel: 'View all roles',
    images: [
      image('https://plus.unsplash.com/premium_photo-1663100126765-1ad02ca4ff69?w=900&q=80&auto=format&fit=crop', 'Luxury hotel spa'),
      image('https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=900&q=80&auto=format&fit=crop', 'Wellness treatment room'),
      image('https://images.unsplash.com/photo-1647960563439-0160d88ca2b7?w=900&q=80&auto=format&fit=crop', 'Luxury spa pool'),
    ],
  },
  cta: {
    background: image('https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1920&q=80&auto=format&fit=crop', 'Quiet luxury spa setting'),
    talent: { eyebrow: 'For talent', heading: 'Ready for your next role?', text: 'Create your free profile and get matched to live roles at exceptional properties on real skills, not CV keywords.', buttonLabel: 'Create free profile', buttonHref: '/register/talent' },
    employer: { eyebrow: 'For employers', heading: 'Ready to find exceptional talent?', text: 'Post roles, search verified candidates and hire with confidence using intelligent matching.', buttonLabel: 'Post a role', buttonHref: '/register/employer' },
  },
  services: {
    cards: [
      { eyebrow: 'Agency marketplace', heading: 'Fill shifts fast. One transparent fee.', text: 'Flexible cover by the hour or day. The professional keeps 100% of the agreed rate; the property pays the rate plus the WHC fee.', buttonLabel: 'Browse practitioners', buttonHref: '/agency/about' },
      { eyebrow: 'WHC Academy', heading: 'Training that gets you booked.', text: 'Professional courses with assessments, verified certificates and CPD hours - built for spa careers.', buttonLabel: 'Explore the Academy', buttonHref: '/academy' },
      { eyebrow: 'Residency programme', heading: 'Visiting specialists in residence.', text: 'Placements of one to six months at destination properties, with terms, payments and payouts protected on the platform.', buttonLabel: 'Explore residencies', buttonHref: '/residency' },
    ],
  },
  testimonials: { eyebrow: 'What people say', heading: 'Trusted by the industry.', linkLabel: 'Read all testimonials' },
  footer: { copyright: '© 2026 Wellness House Collective', staffLabel: 'Staff' },
  sections: [
    { id: 'proof', visible: true }, { id: 'howItWorks', visible: true }, { id: 'product', visible: true },
    { id: 'trust', visible: true }, { id: 'roles', visible: true }, { id: 'cta', visible: true },
    { id: 'services', visible: true }, { id: 'testimonials', visible: true },
  ],
}

export function cloneDefaultWebsiteContent(): WebsiteContent {
  return JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT)) as WebsiteContent
}

// The homepage brand lives in the database, so a saved palette outlives a
// deploy. These are the navy-era values: whenever one is still stored we
// swap in the charcoal default, so the live site moves with the code and
// no admin has to republish to pick the new palette up.
const LEGACY_BRAND: Record<'accent' | 'ink' | 'background' | 'surface', string[]> = {
  accent: ['#0b2f4d', '#07243b', '#123f64'],
  ink: ['#10283b', '#102838'],
  background: ['#ffffff'],
  surface: ['#f5f5f5', '#f5f6f8', '#f7f8fa'],
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
  return parsed.success ? normaliseLegacyBrand(parsed.data) : cloneDefaultWebsiteContent()
}

export function websiteCssVariables(content: WebsiteContent): CSSProperties {
  const headings = {
    modern: 'var(--font-manrope), "Segoe UI", sans-serif',
    editorial: 'var(--font-editorial), Georgia, serif',
    classic: 'Georgia, "Times New Roman", serif',
  }
  const bodies = {
    system: 'var(--font-poppins), "Segoe UI", sans-serif',
    clean: 'var(--font-manrope), "Segoe UI", sans-serif',
    friendly: 'Arial, Helvetica, sans-serif',
  }
  const radii = { square: '0px', soft: '8px', pill: '999px' }
  const spaces = { compact: '0.75', balanced: '1', airy: '1.18' }
  return {
    '--site-accent': content.brand.accent,
    '--site-ink': content.brand.ink,
    '--site-background': content.brand.background,
    '--site-surface': content.brand.surface,
    '--site-heading-font': headings[content.brand.headingFont],
    '--site-body-font': bodies[content.brand.bodyFont],
    '--site-button-radius': radii[content.brand.buttonStyle],
    '--site-space': spaces[content.brand.spacing],
  } as CSSProperties
}
