import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Residency Specialists for Spas & Resorts | Talent House Collective' },
  description: 'Book verified spa and wellness residency specialists for seasonal cover, retreats, pop-ups and multi-month programmes - identity-protected until your booking confirms.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/residency' },
  openGraph: {
    title: 'Residency Specialists for Spas & Resorts | Talent House Collective',
    description: 'Book verified spa and wellness residency specialists for seasonal cover, retreats and programmes.',
  },
}

export default function ResidencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
