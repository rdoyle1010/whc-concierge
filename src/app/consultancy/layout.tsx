import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'UK Spa Consultants & Wellness Advisers | Talent House' },
  description: 'Find independent spa consultants, wellness designers and operators for projects, openings and turnarounds. Verified practices with published specialisms.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/consultancy' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'UK Spa Consultants & Wellness Advisers | Talent House',
    description: 'Find independent spa consultants, wellness designers and operators for projects, openings and turnarounds. Verified practices with published specialisms.',
  },
  twitter: { card: 'summary_large_image', title: 'UK Spa Consultants & Wellness Advisers | Talent House', description: 'Find independent spa consultants, wellness designers and operators for projects, openings and turnarounds. Verified practices with published specialisms.' }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
