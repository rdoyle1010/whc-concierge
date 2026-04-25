import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Premium Spa & Wellness Properties | WHC Concierge' },
  description: 'Discover premium UK spa and wellness properties hiring on WHC Concierge — from five-star London hotels to country estate spas.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/properties' },
  openGraph: {
    title: 'Premium Spa & Wellness Properties | WHC Concierge',
    description: 'Discover premium UK spa and wellness properties hiring on WHC Concierge.',
  },
}

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
