import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Premium Spa & Wellness Properties | Talent House Collective' },
  description: 'Discover premium UK spa and wellness properties hiring on Talent House Collective - from five-star London hotels to country estate spas.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/properties' },
  openGraph: {
    title: 'Premium Spa & Wellness Properties | Talent House Collective',
    description: 'Discover premium UK spa and wellness properties hiring on Talent House Collective.',
  },
}

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
