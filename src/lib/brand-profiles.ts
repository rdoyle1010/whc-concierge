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
  website_url: string | null
  academy_course_slug: string | null
  product_house_name: string | null
  is_published: boolean
  sort_order: number | null
}

export const BRAND_FIELDS = [
  'slug', 'name', 'tagline', 'usp', 'why_spas', 'how_to_sell',
  'director_quote', 'director_name', 'director_role',
  'founded', 'origin', 'hero_ingredients', 'signature_treatments', 'notable_partners',
  'logo_url', 'image_url', 'website_url',
  'academy_course_slug', 'product_house_name', 'is_published', 'sort_order',
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
    website_url: secureImageUrl(raw?.website_url),
    academy_course_slug: text(raw?.academy_course_slug, 80),
    product_house_name: text(raw?.product_house_name, 140),
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
