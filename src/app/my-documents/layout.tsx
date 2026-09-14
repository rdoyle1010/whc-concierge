import type { Metadata } from 'next'

// A client page cannot export metadata, so its title lives here. Without it
// every dashboard page inherits the homepage title, which is the difference
// between a browser tab somebody can find again and eleven identical ones.
export const metadata: Metadata = {
  title: 'Your documents | Talent House Collective',
  description: 'The operational documents you have bought, ready to download and complete.',
  robots: { index: false, follow: false },
}

export default function MyDocumentsLayout({ children }: { children: React.ReactNode }) {
  return children
}
