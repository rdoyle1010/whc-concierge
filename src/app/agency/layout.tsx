import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Agency & Freelance Spa Talent Marketplace | WHC Concierge' },
  description: 'Find verified freelance spa therapists for last-minute shifts, cover and seasonal work. Radius search by postcode, instant booking.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/agency' },
  openGraph: {
    title: 'Agency & Freelance Spa Talent Marketplace | WHC Concierge',
    description: 'Find verified freelance spa therapists for last-minute shifts, cover and seasonal work.',
  },
}

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
