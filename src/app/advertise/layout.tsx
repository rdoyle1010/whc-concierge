import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Advertise to Spa and Wellness Professionals | Talent House Collective' },
  description: 'Sponsored placements in front of a qualified audience of UK spa and wellness professionals, with a clear audience and clear terms.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/advertise' },
  openGraph: {
    title: 'Advertise to Spa and Wellness Professionals | Talent House Collective',
    description: 'Sponsored placements in front of a qualified audience of UK spa and wellness professionals, with a clear audience and clear terms.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
