import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Contact Talent House Collective | Get in Touch' },
  description: 'Get in touch with Talent House Collective - partnerships, support, press and general enquiries about the UK\'s luxury wellness recruitment platform.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/contact' },
  openGraph: {
    title: 'Contact Talent House Collective | Get in Touch',
    description: 'Get in touch with Talent House Collective - partnerships, support, press and general enquiries.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
