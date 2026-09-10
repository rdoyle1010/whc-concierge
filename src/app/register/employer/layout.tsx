import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Hire Spa and Wellness Professionals | Talent House Collective' },
  description: 'Post roles, search verified spa and wellness professionals, book agency cover and build a property profile that attracts the people you want.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/register/employer' },
  openGraph: {
    title: 'Hire Spa and Wellness Professionals | Talent House Collective',
    description: 'Post roles, search verified spa and wellness professionals, book agency cover and build a property profile that attracts the people you want.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
