import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Spa Consultants and Wellness Advisers | Talent House Collective' },
  description: 'Find independent spa consultants, wellness designers and operators for projects, openings and turnarounds. Verified practices with published specialisms.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/consultancy' },
  openGraph: {
    title: 'Spa Consultants and Wellness Advisers | Talent House Collective',
    description: 'Find independent spa consultants, wellness designers and operators for projects, openings and turnarounds. Verified practices with published specialisms.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
