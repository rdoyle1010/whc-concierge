import type { Metadata } from 'next'

// Out of the index, not given a better title.
//
// This page had no metadata of its own, so every freelancer profile inherited
// the Agency directory's title. The obvious fix is a title per person, and it
// is the wrong one: the data behind this page requires an approved employer
// login, and the page names a therapist, their postcode area and their reviews.
//
// Identity protection is something this platform sells to the people on it, so
// a therapist's name and town have no business in a search result. A crawler
// gets an empty shell here anyway, because the directory API refuses it - an
// empty shell carrying the directory's title is simply a duplicate of a page
// that should rank.
//
// noindex, follow: don't list this, do follow the links back out of it.
export const metadata: Metadata = {
  // absolute, or the root template appends the brand a second time.
  title: { absolute: 'Agency professional | Talent House Collective' },
  robots: { index: false, follow: true },
}

export default function AgencyProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
