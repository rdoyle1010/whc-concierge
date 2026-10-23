import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'The Journal | UK Spa & Wellness Industry Insight' },
  description: 'Insights, hiring guides and industry analysis for luxury spa and wellness professionals from Talent House Collective - The Journal.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/blog' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'The Journal | UK Spa & Wellness Industry Insight',
    description: 'Insights, hiring guides and industry analysis for luxury spa and wellness professionals.',
  },
  twitter: { card: 'summary_large_image', title: 'The Journal | UK Spa & Wellness Industry Insight', description: 'Insights, hiring guides and industry analysis for luxury spa and wellness professionals.' }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
