import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact WHC Concierge | Get in Touch',
  description: 'Questions, feedback, or partnership enquiries for Wellness House Collective. Contact us for support with your spa recruitment needs.',
  openGraph: {
    title: 'Contact WHC Concierge | Get in Touch',
    description: 'Questions, feedback, or partnership enquiries for Wellness House Collective.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
