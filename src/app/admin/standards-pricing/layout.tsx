import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prices and bundles | Talent House Collective',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
