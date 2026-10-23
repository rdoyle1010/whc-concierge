import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Spa & Wellness Jobs: Join Free | Talent House' },
  description: 'Create a free profile, be matched to luxury spa and wellness roles across the UK, pick up agency shifts and earn CPD-certified qualifications.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/register/talent' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Spa & Wellness Jobs: Join Free | Talent House',
    description: 'Create a free profile, be matched to luxury spa and wellness roles across the UK, pick up agency shifts and earn CPD-certified qualifications.',
  },
  twitter: { card: 'summary_large_image', title: 'Spa & Wellness Jobs: Join Free | Talent House', description: 'Create a free profile, be matched to luxury spa and wellness roles across the UK, pick up agency shifts and earn CPD-certified qualifications.' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
