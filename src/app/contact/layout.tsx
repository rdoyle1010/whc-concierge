import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Contact Talent House Collective | Get in Touch' },
  description: 'Get in touch with Talent House Collective - partnerships, support, press and general enquiries about the UK\'s luxury wellness recruitment platform.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/contact' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Contact Talent House Collective | Get in Touch',
    description: 'Get in touch with Talent House Collective - partnerships, support, press and general enquiries.',
  },
  twitter: { card: 'summary_large_image', title: 'Contact Talent House Collective | Get in Touch', description: 'Get in touch with Talent House Collective - partnerships, support, press and general enquiries.' }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
