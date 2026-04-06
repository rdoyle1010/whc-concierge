import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Luxury Spa & Wellness Jobs',
  description: 'Search the latest luxury spa, wellness and hospitality vacancies across the UK and Europe. From therapist roles to spa director positions at five-star properties.',
  openGraph: {
    title: 'Browse Luxury Spa & Wellness Jobs | WHC Concierge',
    description: 'Search the latest luxury spa, wellness and hospitality vacancies across the UK and Europe.',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
