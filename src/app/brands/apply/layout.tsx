import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Apply for a Brand Page | Talent House Collective' },
  description: 'A page that argues the case for your product house to spa directors and the therapists who deliver it.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/brands/apply' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Apply for a Brand Page | Talent House Collective',
    description: 'A page that argues your case to the spa directors choosing what to stock next season.',
  },
  twitter: { card: 'summary_large_image', title: 'Apply for a Brand Page | Talent House Collective', description: 'A page that argues your case to the spa directors choosing what to stock next season.' }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
