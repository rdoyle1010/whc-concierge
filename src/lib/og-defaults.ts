// What every page's social card must keep.
//
// Next merges metadata shallowly: a page that declares its own `openGraph`
// replaces the root object outright, including `images`, `siteName`, `locale`
// and `type`. Twenty-six pages declared only a title and a description, so
// twenty-six pages silently lost their og:image and every share of them on
// LinkedIn or WhatsApp arrived as a bare grey link.
//
// It is documented in node_modules/next/dist/docs, it produces no warning, and
// the only visible symptom is on somebody else's website. Spread this into any
// page-level openGraph block and the defaults survive.
export const OG_DEFAULTS = {
  type: 'website' as const,
  locale: 'en_GB',
  siteName: 'Talent House Collective',
  images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Talent House Collective' }],
}
