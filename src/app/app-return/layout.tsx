import type { Metadata } from 'next'

// A handoff screen the mobile app lands on after a purchase. It exists for a few seconds of somebody's session and has no reason to be in a search result.
//
// noindex, follow: don't list this, do follow the links back out of it.
// Deliberately noindex rather than a robots Disallow. Disallow stops the
// crawl, and a page Google cannot fetch is a page whose noindex it never
// reads, so anything already indexed would stay indexed.
export const metadata: Metadata = {
  title: { absolute: 'Returning to the app | Talent House Collective' },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
