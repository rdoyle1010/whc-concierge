import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope, Poppins } from 'next/font/google'
import './globals.css'
import './public-clean.css'
import './portal-clean.css'
import CookieConsent from '@/components/CookieConsent'
import NewsletterSignupBar from '@/components/NewsletterSignupBar'

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

export const metadata: Metadata = {
  title: {
    default: 'WHC Concierge | Spa and Wellness Careers',
    template: '%s | WHC Concierge',
  },
  description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
  keywords: [
    'luxury spa jobs', 'wellness careers', 'spa therapist recruitment', 'hotel spa jobs UK',
    'spa manager jobs', 'beauty therapist vacancies', 'wellness recruitment platform',
    'five-star spa careers', 'hospitality wellness jobs', 'spa director roles',
    'luxury hotel recruitment', 'ESPA therapist', 'Elemis trained therapist',
    'spa residency UK', 'wellness professionals', 'spa agency UK',
  ],
  metadataBase: new URL('https://talent.wellnesshousecollective.co.uk'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'WHC Concierge',
    title: 'WHC Concierge | Spa and Wellness Careers',
    description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
    url: 'https://talent.wellnesshousecollective.co.uk',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'WHC Concierge - The professional platform for spa and wellness careers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WHC Concierge | Spa and Wellness Careers',
    description: 'The professional platform for spa and wellness careers. Live roles, matched on real skills, qualifications and brands.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/images/whc-logo.jpg',
    apple: '/images/whc-logo.jpg',
  },
}

// Static pages inherit this: brand changes published in admin reach every
// page within five minutes without a redeploy.
export const revalidate = 300

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WHC Concierge',
  url: 'https://talent.wellnesshousecollective.co.uk',
  logo: 'https://talent.wellnesshousecollective.co.uk/images/whc-logo.jpg',
  description: 'The professional platform for spa and wellness careers',
  sameAs: [],
}

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
  return (
    <html lang="en-GB" className={`${manrope.variable} ${editorial.variable} ${poppins.variable}`}>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-5 focus:py-3 focus:text-[13px] focus:font-semibold focus:text-[#0b2f4d] focus:shadow-xl focus:border focus:border-[#0b2f4d]">Skip to main content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <div className="website-theme min-h-screen" style={brandStyle}>
          {children}
        </div>
        <NewsletterSignupBar />
        <CookieConsent />
      </body>
    </html>
  )
}
