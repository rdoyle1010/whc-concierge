import type { Metadata } from 'next'

// A client page cannot export metadata, so its title lives here. Without it
// every dashboard page inherits the homepage title, which is the difference
// between a browser tab somebody can find again and eleven identical ones.
export const metadata: Metadata = {
  // The root layout appends "| Talent House Collective" to any plain title
  // string. Spelling the brand out here printed it twice in every search result.
  title: 'Your Documents',
  description: 'The operational documents you have bought, ready to download and complete.',
  robots: { index: false, follow: false },
}

export default function MyDocumentsLayout({ children }: { children: React.ReactNode }) {
  return children
}
