import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Premium Spa & Wellness Properties | Talent House Collective' },
  description: 'Discover premium UK spa and wellness properties hiring on Talent House Collective - from five-star London hotels to country estate spas.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/properties' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Premium Spa & Wellness Properties | Talent House Collective',
    description: 'Discover premium UK spa and wellness properties hiring on Talent House Collective.',
  },
  twitter: { card: 'summary_large_image', title: 'Premium Spa & Wellness Properties | Talent House Collective', description: 'Discover premium UK spa and wellness properties hiring on Talent House Collective.' },
}

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
