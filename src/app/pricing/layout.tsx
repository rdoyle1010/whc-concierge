import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Job Posting Pricing for Employers | WHC Concierge' },
  description: 'Transparent job posting pricing for spa and wellness employers. No commission on hires. Standard and Featured listings.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/pricing' },
  openGraph: {
    title: 'Job Posting Pricing for Employers | WHC Concierge',
    description: 'Transparent job posting pricing for spa and wellness employers. No commission on hires.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
