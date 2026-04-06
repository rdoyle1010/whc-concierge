import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Posting Pricing for Employers',
  description: 'Transparent pricing for posting spa and wellness vacancies on WHC Concierge. Choose from Standard, Gold, and Platinum tiers to reach qualified candidates.',
  openGraph: {
    title: 'Job Posting Pricing for Employers | WHC Concierge',
    description: 'Transparent pricing for posting spa and wellness vacancies on WHC Concierge.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
