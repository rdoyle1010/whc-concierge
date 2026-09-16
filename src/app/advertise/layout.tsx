import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Advertise to UK Spa Professionals | Talent House' },
  description: 'Sponsored placements in front of a qualified audience of UK spa and wellness professionals, with a clear audience and clear terms.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/advertise' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Advertise to UK Spa Professionals | Talent House',
    description: 'Sponsored placements in front of a qualified audience of UK spa and wellness professionals, with a clear audience and clear terms.',
  },
  twitter: { card: 'summary_large_image', title: 'Advertise to UK Spa Professionals | Talent House', description: 'Sponsored placements in front of a qualified audience of UK spa and wellness professionals, with a clear audience and clear terms.' }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
