import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Browse Luxury Spa & Wellness Jobs | WHC Concierge' },
  description: 'Browse live luxury spa, wellness and hospitality jobs across the UK. Roles at five-star hotels, country estates and boutique wellness centres.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/jobs' },
  openGraph: {
    title: 'Browse Luxury Spa & Wellness Jobs | WHC Concierge',
    description: 'Browse live luxury spa, wellness and hospitality jobs across the UK.',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
