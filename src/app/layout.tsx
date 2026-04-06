import type { Metadata } from 'next'
import './globals.css'

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
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'WHC Concierge',
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The UK\'s premier recruitment platform for luxury spa, wellness and hospitality professionals. Connecting elite therapists with five-star properties.',
    url: 'https://talent.wellnesshousecollective.co.uk',
    images: [{ url: '/images/whc-logo.jpg', width: 1200, height: 630, alt: 'Wellness House Collective' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The UK\'s premier recruitment platform for luxury spa, wellness and hospitality professionals.',
    images: ['/images/whc-logo.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/whc-logo.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
