import type { Metadata } from 'next'

// A form a signed-in professional fills in. There is nothing here to read, and a crawler gets an empty shell carrying the Residency page's title.
//
// noindex, follow: don't list this, do follow the links back out of it.
// Deliberately noindex rather than a robots Disallow. Disallow stops the
// crawl, and a page Google cannot fetch is a page whose noindex it never
// reads, so anything already indexed would stay indexed.
export const metadata: Metadata = {
  title: { absolute: 'Create a residency listing | Talent House Collective' },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
