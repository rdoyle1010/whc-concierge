import type { Metadata } from 'next'

// A signed-in matching tool. Without a session it renders an empty card deck, which is a duplicate of nothing and competes with /jobs, the page that should rank.
//
// noindex, follow: don't list this, do follow the links back out of it.
// Deliberately noindex rather than a robots Disallow. Disallow stops the
// crawl, and a page Google cannot fetch is a page whose noindex it never
// reads, so anything already indexed would stay indexed.
export const metadata: Metadata = {
  title: { absolute: 'Role matching | Talent House Collective' },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
