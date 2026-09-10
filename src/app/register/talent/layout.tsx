import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Join as a Spa or Wellness Professional | Talent House Collective' },
  description: 'Create a free profile, be matched to luxury spa and wellness roles across the UK, pick up agency shifts and earn CPD-certified qualifications.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/register/talent' },
  openGraph: {
    title: 'Join as a Spa or Wellness Professional | Talent House Collective',
    description: 'Create a free profile, be matched to luxury spa and wellness roles across the UK, pick up agency shifts and earn CPD-certified qualifications.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
