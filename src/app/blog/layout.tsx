import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'The Journal | Wellness Industry Insights | Talent House Collective' },
  description: 'Insights, hiring guides and industry analysis for luxury spa and wellness professionals from Talent House Collective - The Journal.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/blog' },
  openGraph: {
    title: 'The Journal | Wellness Industry Insights | Talent House Collective',
    description: 'Insights, hiring guides and industry analysis for luxury spa and wellness professionals.',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
