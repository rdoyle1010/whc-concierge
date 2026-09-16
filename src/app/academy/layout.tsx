import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'CPD Courses for Spa Therapists | Talent House Academy' },
  description: 'CPD-certified online courses for spa and wellness professionals: treatment craft, guest experience, retail and spa management.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/academy' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'CPD Courses for Spa Therapists | Talent House Academy',
    description: 'CPD-certified online courses for spa and wellness professionals: treatment craft, guest experience, retail and spa management.',
  },
  twitter: { card: 'summary_large_image', title: 'CPD Courses for Spa Therapists | Talent House Academy', description: 'CPD-certified online courses for spa and wellness professionals: treatment craft, guest experience, retail and spa management.' }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
