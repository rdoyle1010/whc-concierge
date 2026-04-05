import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'WHC Concierge | Luxury Wellness Careers Platform',
    template: '%s | WHC Concierge',
  },
  description: 'The specialist careers platform for luxury wellness. Connecting exceptional spa, wellness and hospitality professionals with the world\'s finest properties.',
  metadataBase: new URL('https://talent.wellnesshousecollective.co.uk'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'WHC Concierge',
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The specialist careers platform for luxury wellness. Connecting exceptional spa, wellness and hospitality professionals with the world\'s finest properties.',
    url: 'https://talent.wellnesshousecollective.co.uk',
    images: [{ url: '/images/whc-logo.jpg', width: 1200, height: 630, alt: 'Wellness House Collective' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WHC Concierge | Luxury Wellness Careers Platform',
    description: 'The specialist careers platform for luxury wellness.',
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
