import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Browse Luxury Spa & Wellness Jobs | Talent House Collective' },
  description: 'Browse live luxury spa, wellness and hospitality jobs across the UK. Roles at five-star hotels, country estates and boutique wellness centres.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/jobs' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Browse Luxury Spa & Wellness Jobs | Talent House Collective',
    description: 'Browse live luxury spa, wellness and hospitality jobs across the UK.',
  },
  twitter: { card: 'summary_large_image', title: 'Browse Luxury Spa & Wellness Jobs | Talent House Collective', description: 'Browse live luxury spa, wellness and hospitality jobs across the UK.' },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
