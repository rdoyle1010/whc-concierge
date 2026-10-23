import type { Metadata } from 'next'
import { getPublicPagesContent } from '@/lib/public-page-content-server'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'

const TITLE = 'Frequently Asked Questions | Talent House Collective'
const DESCRIPTION = 'Answers to the most common questions about Talent House Collective - pricing, vetting, matching, and account help.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/faq` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

// FAQPage structured data, emitted from the layout.
//
// The page itself is a client component so it cannot do this, but the answers
// are already in the served HTML and already load on the server. Twenty-one
// questions, written and edited by hand, and not one of them was eligible for
// a rich result. This is the cheapest structured data on the site.
export default async function FaqLayout({ children }: { children: React.ReactNode }) {
  let mainEntity: unknown[] = []
  try {
    const { faq } = await getPublicPagesContent(false)
    mainEntity = (faq || []).flatMap(section => (section.items || []).map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })))
  } catch {
    // A failed read must not take the page down with it. No schema is a missed
    // rich result; a thrown error is a five hundred on a page people reach
    // when they are already confused.
  }

  return <>
    {mainEntity.length > 0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity }) }}
      />
    )}
    {children}
  </>
}
