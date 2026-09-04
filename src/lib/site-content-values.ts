import type { CSSProperties } from 'react'
import type { WebsiteContent } from './site-content'

// The values client components need from the website content module,
// with no zod behind them.
//
// site-content.ts imports zod for its schemas. SiteBrandProvider sits in the
// root layout and reached into it for DEFAULT_LOGO, so the whole validator
// shipped to every page on the site to supply a default logo url. Navbar,
// Footer and Wordmark did the same for a helper apiece.
//
// The type import above is erased at compile time, so this file pulls
// nothing at runtime and the cycle it appears to form does not exist.

export const DEFAULT_LOGO = {
  url: '/images/whc-logo-charcoal.jpg',
  alt: 'Talent House Collective',
  fit: 'fill' as const,
}

export function safeLogoUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed || /["'()\s<>\\]/.test(trimmed)) return DEFAULT_LOGO.url
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : DEFAULT_LOGO.url
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


const image = (url: string, alt: string): WebsiteContent['howItWorks']['image'] => ({ url, alt, focalX: 50, focalY: 50 })

// Moved here with DEFAULT_LOGO: use-site-content.ts is the hook behind both
// Navbar and Footer, so importing these as values from the schema module put
// zod on every page of the site.

const emptyPanelImage = { url: '', alt: '', focalX: 50, focalY: 50 }

export const DEFAULT_PANELS = {
  homepageCta: { mode: 'brand' as const, image: { ...emptyPanelImage }, overlay: 72 },
  authPanel: { mode: 'brand' as const, image: { ...emptyPanelImage }, overlay: 72 },
  // Picture boxes rather than backdrops: these sit beside the copy in bands
  // where the text fills half the width and the rest was dead space. Empty
  // until a picture is uploaded, so the pages look exactly as they do now.
  intelligenceHero: { mode: 'brand' as const, image: { ...emptyPanelImage }, overlay: 72 },
  intelligenceJournal: { mode: 'brand' as const, image: { ...emptyPanelImage }, overlay: 72 },
  agencyProfessional: { mode: 'brand' as const, image: { ...emptyPanelImage }, overlay: 72 },
}

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  version: 1,
  brand: {
    headingFont: 'modern', bodyFont: 'system', accent: '#1C1C1C', ink: '#1C1C1C',
    background: '#F7F7F7', surface: '#F1F1F1', buttonStyle: 'square', spacing: 'airy',
    logo: { ...DEFAULT_LOGO },
  },
  navigation: {
    jobs: 'Browse Roles', agency: 'Agency', academy: 'Academy', residency: 'Residency', blog: 'Journal',
    talentSignIn: 'Talent Sign In', employerSignIn: 'Hotel Sign In',
  },
  hero: {
    slides: [
      { image: image('https://images.unsplash.com/photo-1720678418766-2628e52f4634?w=1920&q=80&auto=format&fit=crop', 'Luxury spa interior'), eyebrow: 'Talent House Collective', heading: 'The professional platform for spa and wellness careers', text: 'Find exceptional people. Build better careers. Develop stronger spa businesses.' },
      { image: image('https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=1920&q=80&auto=format&fit=crop', 'Calm luxury treatment space'), eyebrow: 'Intelligent matching', heading: 'Precision matching, not guesswork', text: 'Skills, qualifications, brands, location and availability, weighted and scored - so both sides can see why a match is right.' },
      { image: image('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80&auto=format&fit=crop', 'Wellness treatment setting'), eyebrow: 'Verified by Talent House', heading: 'Every profile tells the full story', text: 'Right-to-work, insurance and qualifications reviewed by Talent House before the Verified badge is awarded.' },
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
      { eyebrow: 'Agency marketplace', heading: 'Fill shifts fast. One transparent fee.', text: 'Flexible cover by the hour or day. The professional keeps 100% of the agreed rate; the property pays the rate plus the Talent House fee.', buttonLabel: 'Browse practitioners', buttonHref: '/agency/about' },
      { eyebrow: 'Talent House Academy', heading: 'Training that gets you booked.', text: 'Professional courses with assessments, verified certificates and CPD hours - built for spa careers.', buttonLabel: 'Explore the Academy', buttonHref: '/academy' },
      { eyebrow: 'Residency programme', heading: 'Visiting specialists in residence.', text: 'Placements of one to six months at destination properties, with terms, payments and payouts protected on the platform.', buttonLabel: 'Explore residencies', buttonHref: '/residency' },
    ],
  },
  testimonials: { eyebrow: 'What people say', heading: 'Trusted by the industry.', linkLabel: 'Read all testimonials' },
  panels: JSON.parse(JSON.stringify(DEFAULT_PANELS)),
  footer: { copyright: '© 2026 Talent House Collective', staffLabel: 'Staff' },
  sections: [
    { id: 'proof', visible: true }, { id: 'howItWorks', visible: true }, { id: 'product', visible: true },
    { id: 'trust', visible: true }, { id: 'roles', visible: true }, { id: 'cta', visible: true },
    { id: 'services', visible: true }, { id: 'testimonials', visible: true },
  ],
}
