import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Freelance Spa Therapist Cover & Shifts | Talent House' },
  description: 'Find verified freelance spa therapists for last-minute shifts, cover and seasonal work. Radius search by postcode, instant booking.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/agency' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Freelance Spa Therapist Cover & Shifts | Talent House',
    description: 'Find verified freelance spa therapists for last-minute shifts, cover and seasonal work.',
  },
  twitter: { card: 'summary_large_image', title: 'Freelance Spa Therapist Cover & Shifts | Talent House', description: 'Find verified freelance spa therapists for last-minute shifts, cover and seasonal work.' }
}

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
