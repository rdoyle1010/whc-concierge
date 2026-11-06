import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

const TITLE = 'The Spa and Wellness Workforce Platform | Talent House'
const DESCRIPTION =
  'Hiring, flexible cover, residencies, training, operating standards and market data for luxury spa and wellness, on one platform. Book a demo.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: 'https://talenthousecollective.co.uk/platform' },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
