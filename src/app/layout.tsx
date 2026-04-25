import type { Metadata } from 'next'
import './globals.css'
import CookieConsent from '@/components/CookieConsent'

export const metadata: Metadata = {
  title: {
    default: 'WHC Concierge | Luxury Wellness Careers Platform',
    template: '%s | WHC Concierge',
  },
  description: 'The UK\'s premier recruitment platform for luxury spa, wellness and hospitality professionals. Connecting elite therapists with five-star properties.',
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
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The UK\'s premier recruitment platform for luxury spa, wellness and hospitality professionals. Connecting elite therapists with five-star properties.',
    url: 'https://talent.wellnesshousecollective.co.uk',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'WHC Concierge — Luxury Wellness Careers Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The UK\'s premier recruitment platform for luxury spa, wellness and hospitality professionals.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/whc-logo.jpg',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WHC Concierge',
  url: 'https://talent.wellnesshousecollective.co.uk',
  logo: 'https://talent.wellnesshousecollective.co.uk/images/whc-logo.jpg',
  description: 'The UK\'s premier luxury wellness recruitment platform',
  sameAs: [],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
