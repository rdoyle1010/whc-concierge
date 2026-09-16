import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Hire Spa & Wellness Staff | Talent House' },
  description: 'Post roles, search verified spa and wellness professionals, book agency cover and build a property profile that attracts the people you want.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/register/employer' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Hire Spa & Wellness Staff | Talent House',
    description: 'Post roles, search verified spa and wellness professionals, book agency cover and build a property profile that attracts the people you want.',
  },
  twitter: { card: 'summary_large_image', title: 'Hire Spa & Wellness Staff | Talent House', description: 'Post roles, search verified spa and wellness professionals, book agency cover and build a property profile that attracts the people you want.' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
