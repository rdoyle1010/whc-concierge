import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BuyButton from '@/components/BuyButton'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { kindLabel } from '@/lib/documents/journey'
import { formatPrice, categoryPacks, everythingPacks, packBySlug, VAT_NOTE } from '@/lib/documents/pricing'
import { DOCUMENT_STATUS } from '@/lib/documents/status'

// A page for each pack.
//
// The shop is one URL carrying five hundred and sixty document titles and
// twenty packs. Nobody searches for a shop. They search for "spa risk
// assessment template" and "spa manager job description", and a single page
// trying to rank for five hundred intents ranks for none of them.
//
// It is also the answer to a second problem. A page that is one thing can be
// understood; a page that is twenty things cannot, and "I do not understand
// what you are selling" is the most expensive sentence a shop can produce.
//
// Server rendered, statically generated, with the document list in the HTML
// rather than fetched afterwards, so there is something for a search engine
// or an assistant to actually read and cite.

const BASE = 'https://talenthousecollective.co.uk'

const packs = () => [...categoryPacks(), ...everythingPacks()]

export function generateStaticParams() {
  return packs().map(pack => ({ slug: pack.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const pack = packBySlug(slug)
  if (!pack) return { title: 'Not found' }

  const title = `${pack.name}: ${pack.count} documents | Talent House Collective`
  const description = pack.blurb.slice(0, 155)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE}/standards/packs/${pack.slug}` },
    openGraph: {
      type: 'website',
      url: `${BASE}/standards/packs/${pack.slug}`,
      title: pack.name,
      description,
      images: [{ url: `${BASE}/images/standards/risk-matrix.jpg`, width: 620, height: 877, alt: pack.name }],
    },
    twitter: { card: 'summary_large_image', title: pack.name, description },
  }
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pack = packBySlug(slug)
  if (!pack || packs().every(entry => entry.slug !== slug)) notFound()

  const inside = sellableCatalogue().filter(entry => pack.includes(entry.reference))
  const byKind = new Map<string, typeof inside>()
  for (const entry of inside) {
    const label = kindLabel(entry.reference)
    byKind.set(label, [...(byKind.get(label) || []), entry])
  }
  const kinds = [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)

  // Product and Offer, so a price and an availability can appear in a search
  // result, and so an assistant answering "what does a spa risk assessment
  // pack cost" has something structured to read.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pack.name,
    description: pack.blurb,
    brand: { '@type': 'Brand', name: 'Talent House Collective' },
    offers: {
      '@type': 'Offer',
      price: (pack.price / 100).toFixed(2),
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      url: `${BASE}/standards/packs/${pack.slug}`,
    },
  }

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Standards', item: `${BASE}/standards` },
      { '@type': 'ListItem', position: 2, name: pack.name, item: `${BASE}/standards/packs/${pack.slug}` },
    ],
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

        <section className="border-b border-[#dcd4c8]">
          <div className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
            <p className="text-[12px] text-[#6e6a60]">
              <Link href="/standards" className="underline underline-offset-2">Standards</Link>
              {' / '}{pack.name}
            </p>
            <h1 className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.08] text-[#222321] md:text-[46px]">
              {pack.name}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#3a3832]">
              {pack.detail || pack.blurb}
            </p>
            <p className="mt-6 font-serif text-[34px] leading-none text-[#222321]">{formatPrice(pack.price)}</p>
            <p className="mt-1.5 text-[13px] text-[#6e6a60]">
              {pack.count} documents. {VAT_NOTE}
            </p>
            <div className="mt-6">
              <BuyButton packSlug={pack.slug} label={`Buy ${pack.name.toLowerCase()}`} primary />
            </div>
          </div>
        </section>

        <section className="border-b border-[#dcd4c8]">
          <div className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
            <h2 className="text-[24px] font-semibold text-[#222321]">What is in it</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#57544c]">
              Every document, by name. {DOCUMENT_STATUS}
            </p>

            {kinds.map(([label, entries]) => (
              <div key={label} className="mt-8">
                <h3 className="text-[11px] uppercase tracking-[.12em] text-[#6e6a60]">
                  {entries.length} {label.toLowerCase()}{entries.length === 1 ? '' : 's'}
                </h3>
                <ul className="mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2">
                  {entries.map(entry => (
                    <li key={entry.reference} className="text-[14px] leading-snug text-[#222321]">
                      <Link href={`/standards/${entry.reference}`} className="hover:underline">
                        {entry.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#ede8df]">
          <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
            <h2 className="text-[20px] font-semibold text-[#222321]">Other packs</h2>
            <ul className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2">
              {packs().filter(entry => entry.slug !== pack.slug).slice(0, 10).map(entry => (
                <li key={entry.slug} className="text-[14px] text-[#222321]">
                  <Link href={`/standards/packs/${entry.slug}`} className="hover:underline">{entry.name}</Link>
                  <span className="text-[#6e6a60]"> · {formatPrice(entry.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
