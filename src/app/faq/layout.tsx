import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Frequently Asked Questions | Talent House Collective' },
  description: 'Answers to the most common questions from spa professionals and employers about Talent House Collective - pricing, vetting, matching, and account help.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | Talent House Collective',
    description: 'Answers to the most common questions about Talent House Collective - pricing, vetting, matching, and account help.',
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
