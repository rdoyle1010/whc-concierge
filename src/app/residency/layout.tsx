import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Spa Residency Specialists & Seasonal Cover | Talent House' },
  description: 'Book verified spa and wellness residency specialists for seasonal cover, retreats, pop-ups and multi-month programmes.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/residency' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Spa Residency Specialists & Seasonal Cover | Talent House',
    description: 'Book verified spa and wellness residency specialists for seasonal cover, retreats and programmes.',
  },
  twitter: { card: 'summary_large_image', title: 'Spa Residency Specialists & Seasonal Cover | Talent House', description: 'Book verified spa and wellness residency specialists for seasonal cover, retreats and programmes.' },
}

export default function ResidencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
