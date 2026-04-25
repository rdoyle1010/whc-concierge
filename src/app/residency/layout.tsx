import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Spa Residencies & Seasonal Placements | WHC Concierge' },
  description: 'Browse spa residencies and seasonal placements at iconic UK and international properties — short-term to multi-month engagements.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/residency' },
  openGraph: {
    title: 'Spa Residencies & Seasonal Placements | WHC Concierge',
    description: 'Browse spa residencies and seasonal placements at iconic UK and international properties.',
  },
}

export default function ResidencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
