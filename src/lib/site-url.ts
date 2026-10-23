// The one canonical origin.
//
// It was retyped in the root layout, the sitemap, robots, the blog structured
// data and a dozen metadata blocks. The old host - talent.wellnesshousecollective
// .co.uk - is a 301 and must never appear in a canonical, a sitemap entry or a
// piece of structured data, so there is one definition of the origin and every
// caller reads it.
export const SITE_URL = 'https://talenthousecollective.co.uk'
