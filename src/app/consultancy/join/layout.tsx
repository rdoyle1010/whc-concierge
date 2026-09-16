import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'

const TITLE = 'List Your Spa Consultancy Practice | Talent House'
const DESCRIPTION = 'Put your spa or wellness consultancy in front of the operators looking for one. Free to list, and you keep the fee you agree.'

// The page is a client component, so its title has to come from a layout.
// Without one it inherited the homepage's, which is how a page ends up in the
// sitemap competing with the homepage under the homepage's own words.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/consultancy/join` },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/consultancy/join` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function ConsultancyJoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
