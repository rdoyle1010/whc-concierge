import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Contact WHC Concierge | Get in Touch' },
  description: 'Get in touch with WHC Concierge — partnerships, support, press and general enquiries about the UK\'s luxury wellness recruitment platform.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/contact' },
  openGraph: {
    title: 'Contact WHC Concierge | Get in Touch',
    description: 'Get in touch with WHC Concierge — partnerships, support, press and general enquiries.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
