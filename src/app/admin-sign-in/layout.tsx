import type { Metadata } from 'next'

// The staff sign-in page. Nothing to index, and the one thing a search result
// for it could ever do is point strangers at the administrator's door.
//
// noindex rather than a robots Disallow, and the distinction decided it:
// Disallow stops the crawl, and a page Google cannot fetch is a page whose
// noindex it never reads, so anything already listed would stay listed. This
// page spent a fortnight statically prerendered and crawlable, so assume it
// was seen and take it out rather than merely hide it.
export const metadata: Metadata = {
  title: { absolute: 'Staff sign in | Talent House Collective' },
  robots: { index: false, follow: false },
}

export default function AdminSignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
