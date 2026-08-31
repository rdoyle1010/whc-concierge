import { z } from 'zod'

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

const defaultEditorialBand = [
  { url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=82&w=1600', alt: 'Luxury spa treatment in progress', label: 'Spa & wellness', focalX: 50, focalY: 50 },
  { url: 'https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&q=82&w=1600', alt: 'Contemporary luxury hospitality interior', label: 'Exceptional properties', focalX: 50, focalY: 50 },
  { url: 'https://images.unsplash.com/photo-1779956511234-963c515b0516?auto=format&fit=crop&q=82&w=1600', alt: 'Modern timber sauna and wellness space', label: 'Wellness environments', focalX: 50, focalY: 50 },
  { url: 'https://images.unsplash.com/photo-1751972788348-3360f69603f6?auto=format&fit=crop&q=82&w=1600', alt: 'Warm Mediterranean hospitality courtyard', label: 'Destination hospitality', focalX: 50, focalY: 50 },
]

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

const image = (url: string, alt: string) => ({ url, alt, focalX: 50, focalY: 50 })
const block = (eyebrow: string, heading: string, text: string, url = '', alt = '') => ({ eyebrow, heading, text, image: image(url, alt), visible: true })

export const DEFAULT_PUBLIC_PAGES_CONTENT: PublicPagesContent = {
  version: 1,
  editorialBand: defaultEditorialBand,
  pages: {
    properties: {
      label: 'Properties',
      hero: {
        eyebrow: 'WHC properties',
        heading: 'Exceptional places to work.',
        text: 'Meet verified hotels, spas and wellness destinations using WHC Concierge to find exceptional people. Featured properties appear first.',
        image: image('https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&q=82&w=1800', 'Luxury hospitality interior'),
      },
      blocks: [
        block('Verified partners', 'Properties building their teams with us.', 'Discover properties using WHC Concierge to recruit and book exceptional wellness professionals.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=82&w=1600', 'Luxury spa treatment'),
        block('A better first impression', 'See the place behind the role.', 'Property photography, brand information, reviews and live opportunities help professionals understand where they could work.', 'https://images.unsplash.com/photo-1779956511234-963c515b0516?auto=format&fit=crop&q=82&w=1600', 'Contemporary wellness space'),
        block('For exceptional properties', 'Your employer brand should be visible.', 'Verified properties can build a richer profile so talent sees more than a job title.', 'https://images.unsplash.com/photo-1751972788348-3360f69603f6?auto=format&fit=crop&q=82&w=1600', 'Luxury destination hospitality'),
      ],
    },
    agency: {
      label: 'Agency',
      hero: {
        eyebrow: 'Flexible spa staffing',
        heading: 'Need a therapist tomorrow? Want flexible spa shifts?',
        text: 'Agency connects spas and hotels that need qualified cover with professionals who have chosen when they are available to work. Employers search the shift. Professionals choose when and where they work.',
        image: image('https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=82&w=1800', 'Spa professional delivering a treatment'),
      },
      blocks: [
        block('For employers', 'Post the shift. See who is genuinely available.', 'Choose the date, hours, location and treatments you need. WHC Concierge shows suitable professionals whose availability fits the whole shift, together with their experience, skills, rate, location and verification information. Review the profile, make an offer and confirm the cover.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=82&w=1600', 'Luxury hotel spa team'),
        block('For professionals', 'Tell us when you are free. You decide what you accept.', 'Set your exact availability, hourly rate, travel radius, treatment skills and preferred working area. Suitable properties can find you for the hours you have chosen. You review the opportunity and decide whether the shift works for you.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=82&w=1600', 'Wellness professional'),
        block('Verification made clearer', 'Qualified abroad? Your experience should still make sense here.', 'Spa is an international industry. Profiles can show where a professional trained, the treatments they are qualified to perform, qualification review status, right-to-work information and insurance status. Where a formal UK equivalence has not been established, the platform does not pretend that it has.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=82&w=1600', 'Spa therapist at work'),
      ],
    },
    residency: {
      label: 'Residency',
      hero: {
        eyebrow: 'Curated Residency Marketplace',
        heading: 'Bring exceptional wellness talent into your property.',
        text: 'Discover experienced specialists for seasonal, short-term and signature residencies. Identity stays protected while you discuss fit, then agreed terms and payment stay securely on WHC Concierge.',
        image: image('https://images.unsplash.com/photo-1779956511234-963c515b0516?auto=format&fit=crop&q=82&w=1800', 'Destination wellness setting'),
      },
      blocks: [
        block('Residency talent', 'Specialists available for placement', 'Discover visiting practitioners, educators, trainers and programme creators for focused placements.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=82&auto=format&fit=crop', 'Luxury spa setting'),
        block('For properties', 'Create something guests cannot get every day.', 'Residencies can bring distinctive expertise, seasonal programming and new commercial energy into a spa or wellness operation.', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=82&w=1600', 'Spa and wellness experience'),
        block('For specialists', 'Take your expertise somewhere remarkable.', 'Package your specialism, availability, preferred destinations and commercial terms into a protected professional listing.', 'https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&q=82&w=1600', 'Wellness practitioner'),
      ],
    },
    pricing: {
      label: 'Pricing',
      hero: {
        eyebrow: 'Pricing',
        heading: 'Choose what you need. Know what you pay.',
        text: 'A free career profile at the centre, optional visibility and flexible-work memberships for professionals, and clear commercial pricing for properties.',
        image: image('https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=82&w=1800', 'Luxury spa treatment environment'),
      },
      blocks: [
        block('For professionals', 'Start free. Add only what helps your career.', 'Permanent recruitment remains free for Talent. Paid options are for extra visibility or participation in specialist marketplaces.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=82&w=1600', 'Wellness professional'),
        block('Flexible staffing & specialist bookings', 'The property pays the platform fee.', 'For Agency and Residency bookings, the commercial split is shown before confirmation so both sides know what has been agreed.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=82&w=1600', 'Premium hotel'),
        block('For employers', 'Permanent recruitment, without salary commission.', 'Choose the reach and support level for each role. Once you hire, there is no additional percentage fee on salary.', 'https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&q=82&w=1600', 'Luxury property interior'),
      ],
    },
    'coming-soon': {
      label: 'Coming Soon',
      hero: {
        eyebrow: 'Coming next',
        heading: 'WHC Concierge is only the beginning.',
        text: 'We are building the talent, flexible staffing and career-confidence platform for hospitality - starting with spa and wellness, then expanding into the departments every great property depends on.',
        image: image('https://images.unsplash.com/photo-1751972788348-3360f69603f6?auto=format&fit=crop&q=82&w=1800', 'Luxury hospitality destination'),
      },
      blocks: [
        block('AI Interview & Confidence Coach', 'Not an answer machine. A confidence builder.', 'Help professionals understand themselves, pull stronger evidence from their own experience and practise until they can answer with confidence.', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=82&w=1600', 'Professionals in conversation'),
        block('Hospitality expansion', 'From spa into the departments that make hospitality work.', 'Permanent jobs and flexible Agency staffing will expand beyond spa while Residency stays specialist.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=82&w=1600', 'Hospitality property'),
        block('Property arrival packs', 'Know the property before your first shift starts.', 'Confirmed Agency and Residency professionals receive the practical details they need before they arrive.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=82&w=1600', 'Spa operations'),
      ],
    },
  },
}

export function cloneDefaultPublicPagesContent(): PublicPagesContent {
  return JSON.parse(JSON.stringify(DEFAULT_PUBLIC_PAGES_CONTENT)) as PublicPagesContent
}

export function parsePublicPagesContent(value: unknown): PublicPagesContent {
  const raw = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return null } })() : value
  const parsed = PublicPagesContentSchema.safeParse(raw)
  return parsed.success ? parsed.data : cloneDefaultPublicPagesContent()
}
