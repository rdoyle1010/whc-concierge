import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Frequently Asked Questions | WHC Concierge' },
  description: 'Answers to the most common questions from spa professionals and employers about WHC Concierge — pricing, vetting, matching, and account help.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | WHC Concierge',
    description: 'Answers to the most common questions about WHC Concierge — pricing, vetting, matching, and account help.',
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
