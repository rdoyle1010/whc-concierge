import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Apply for a Brand Page | Talent House Collective' },
  description: 'Product houses working with Talent House get a page that argues their case to spa directors and the therapists who deliver them. Tell us about your house and we will draft it.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/brands/apply' },
  openGraph: {
    title: 'Apply for a Brand Page | Talent House Collective',
    description: 'A page that argues your case to the spa directors choosing what to stock next season.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
