import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope, Poppins } from 'next/font/google'
import './globals.css'
import './public-clean.css'
import './portal-clean.css'
import CookieConsent from '@/components/CookieConsent'
import NewsletterSignupBar from '@/components/NewsletterSignupBar'
import { SiteBrandProvider } from '@/components/SiteBrandProvider'
import { DEFAULT_LOGO, safeLogoUrl } from '@/lib/site-content'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const editorial = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
  weight: ['500', '600', '700'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600'],
})

const SITE_URL = 'https://talenthousecollective.co.uk'

// The logo is uploaded in Website & Brand, so the favicon, the Organization
// JSON-LD and the header lockup all have to read the published value rather
// than a path baked into this file.
async function publishedLogo() {
  try {
    const { getWebsiteContent } = await import('@/lib/site-content-server')
    const content = await getWebsiteContent(false)
    return { ...content.brand.logo, url: safeLogoUrl(content.brand.logo.url) }
  } catch {
    return { ...DEFAULT_LOGO }
  }
}

const baseMetadata: Metadata = {
  title: {
    default: 'Talent House Collective | Spa and Wellness Careers',
    template: '%s | Talent House Collective',
  },
  description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
  keywords: [
    'luxury spa jobs', 'wellness careers', 'spa therapist recruitment', 'hotel spa jobs UK',
    'spa manager jobs', 'beauty therapist vacancies', 'wellness recruitment platform',
    'five-star spa careers', 'hospitality wellness jobs', 'spa director roles',
    'luxury hotel recruitment', 'ESPA therapist', 'Elemis trained therapist',
    'spa residency UK', 'wellness professionals', 'spa agency UK',
  ],
  metadataBase: new URL('https://talenthousecollective.co.uk'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Talent House Collective',
    title: 'Talent House Collective | Spa and Wellness Careers',
    description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
    url: 'https://talenthousecollective.co.uk',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Talent House Collective - The professional platform for spa and wellness careers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talent House Collective | Spa and Wellness Careers',
    description: 'The professional platform for spa and wellness careers. Live roles, matched on real skills, qualifications and brands.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: DEFAULT_LOGO.url,
    apple: DEFAULT_LOGO.url,
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const logo = await publishedLogo()
  return { ...baseMetadata, icons: { icon: logo.url, apple: logo.url } }
}

// Static pages inherit this: brand changes published in admin reach every
// page within five minutes without a redeploy.
export const revalidate = 300

const organizationJsonLd = (logoUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Talent House Collective',
  url: SITE_URL,
  logo: logoUrl.startsWith('http') ? logoUrl : SITE_URL + logoUrl,
  description: 'The professional platform for spa and wellness careers',
  sameAs: [],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The Website & Brand settings (fonts, colours, button shape, spacing)
  // apply to the whole platform, not just the homepage: the published brand
  // is resolved once here and exposed as CSS variables on the root wrapper.
  let brandStyle: React.CSSProperties = {}
  try {
    const { getWebsiteContent } = await import('@/lib/site-content-server')
    const { websiteCssVariables } = await import('@/lib/site-content')
    brandStyle = websiteCssVariables(await getWebsiteContent(false))
  } catch { /* fall back to CSS defaults */ }
  const logo = await publishedLogo()
  return (
    <html lang="en-GB" className={`${manrope.variable} ${editorial.variable} ${poppins.variable}`}>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-5 focus:py-3 focus:text-[13px] focus:font-semibold focus:text-[#1c1b1a] focus:shadow-xl focus:border focus:border-[#1c1b1a]">Skip to main content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(logo.url)) }} />
        <div className="website-theme min-h-screen" style={brandStyle}>
          <SiteBrandProvider logo={logo}>{children}</SiteBrandProvider>
        </div>
        <NewsletterSignupBar />
        <CookieConsent />
      </body>
    </html>
  )
}
