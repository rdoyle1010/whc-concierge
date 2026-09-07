// A brand's case for itself, and the shape every surface reads it through.
//
// A property gets a page here that argues for it. A product house, which is
// the business a spa director actually has to be persuaded about, got nothing.
// This is that page's data, and it is deliberately shaped as an argument
// rather than a profile: the proposition, the reason to stock it, the person
// who runs it, and how a therapist would sell it on the floor.

export type BrandProfile = {
  slug: string
  name: string
  tagline: string | null
  usp: string | null
  why_spas: string | null
  // The three voices. why_spas is the commercial case; why_we_love_it is our
  // own verdict, which is the only reason anybody trusts a directory whose
  // other words come from the brand; why_therapists_love_it is the view of the
  // people who will actually have to work with it every day.
  why_we_love_it: string | null
  why_therapists_love_it: string | null
  how_to_sell: string | null
  director_quote: string | null
  director_name: string | null
  director_role: string | null
  founded: string | null
  origin: string | null
  hero_ingredients: string[]
  signature_treatments: string[]
  notable_partners: string[]
  logo_url: string | null
  image_url: string | null
  // The deck. One picture was never going to carry a brand: a house sells on
  // the room, the product, the texture and the moment in the treatment.
  gallery: string[]
  website_url: string | null
  academy_course_slug: string | null
  product_house_name: string | null
  // A page that persuades and offers no way to act has wasted the persuasion.
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  contact_phone: string | null
  is_published: boolean
  sort_order: number | null
}

export const BRAND_FIELDS = [
  'slug', 'name', 'tagline', 'usp', 'why_spas', 'why_we_love_it', 'why_therapists_love_it', 'how_to_sell',
  'director_quote', 'director_name', 'director_role',
  'founded', 'origin', 'hero_ingredients', 'signature_treatments', 'notable_partners',
  'logo_url', 'image_url', 'gallery', 'website_url',
  'academy_course_slug', 'product_house_name',
  'contact_name', 'contact_role', 'contact_email', 'contact_phone',
  'is_published', 'sort_order',
].join(',')

const text = (value: unknown, limit: number) => {
  const cleaned = String(value ?? '').trim().slice(0, limit)
  return cleaned || null
}

const listOf = (value: unknown, limit: number) =>
  (Array.isArray(value) ? value : [])
    .map(item => String(item ?? '').trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, limit)

// An address we are about to print on a public page and invite strangers to
// write to. A malformed one is a dead end for the brand, not for us.
export function cleanEmail(value: unknown) {
  const email = String(value ?? '').trim().toLowerCase().slice(0, 254)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

// A slug is the address of the page. Anything that is not a slug would be a
// broken link, so it is cleaned rather than trusted.
export function cleanBrandSlug(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// Only https images. A page that argues a brand is worth five figures a year
// cannot serve its logo over plain http, and a mixed-content block would show
// the spa director a broken picture at exactly the wrong moment.
export function secureImageUrl(value: unknown) {
  const url = String(value ?? '').trim().slice(0, 1000)
  return /^https:\/\//i.test(url) ? url : null
}

export function normaliseBrand(raw: any): BrandProfile {
  return {
    slug: cleanBrandSlug(raw?.slug),
    name: text(raw?.name, 140) || '',
    tagline: text(raw?.tagline, 300),
    usp: text(raw?.usp, 1000),
    why_spas: text(raw?.why_spas, 4000),
    why_we_love_it: text(raw?.why_we_love_it, 4000),
    why_therapists_love_it: text(raw?.why_therapists_love_it, 4000),
    how_to_sell: text(raw?.how_to_sell, 4000),
    director_quote: text(raw?.director_quote, 2000),
    director_name: text(raw?.director_name, 140),
    director_role: text(raw?.director_role, 140),
    founded: text(raw?.founded, 120),
    origin: text(raw?.origin, 200),
    hero_ingredients: listOf(raw?.hero_ingredients, 12),
    signature_treatments: listOf(raw?.signature_treatments, 16),
    notable_partners: listOf(raw?.notable_partners, 16),
    logo_url: secureImageUrl(raw?.logo_url),
    image_url: secureImageUrl(raw?.image_url),
    // Anything that is not a secure image address is dropped rather than
    // printed as a broken picture on a page arguing for somebody's brand.
    gallery: (Array.isArray(raw?.gallery) ? raw.gallery : [])
      .map(secureImageUrl)
      .filter((url: string | null): url is string => Boolean(url))
      .slice(0, 12),
    website_url: secureImageUrl(raw?.website_url),
    academy_course_slug: text(raw?.academy_course_slug, 80),
    product_house_name: text(raw?.product_house_name, 140),
    contact_name: text(raw?.contact_name, 140),
    contact_role: text(raw?.contact_role, 140),
    contact_email: cleanEmail(raw?.contact_email),
    contact_phone: text(raw?.contact_phone, 60),
    is_published: Boolean(raw?.is_published),
    sort_order: Number.isFinite(Number(raw?.sort_order)) && raw?.sort_order !== null && raw?.sort_order !== ''
      ? Math.round(Number(raw.sort_order))
      : null,
  }
}

// What a brand must have before it may go public. A half-written page makes
// the brand look worse than no page at all, which is the opposite of the deal
// we offered them.
export function validateBrand(brand: BrandProfile): string | null {
  if (!brand.slug) return 'Give the brand a web address before saving.'
  if (!brand.name) return 'Give the brand a name.'
  if (!brand.is_published) return null
  if (!brand.usp) return 'A published brand needs its proposition in one line. That is the first thing a spa director reads.'
  if (!brand.why_spas) return 'A published brand needs the case for stocking it. Without that the page is a brochure, not an argument.'
  return null
}
