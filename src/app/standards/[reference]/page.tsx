import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BuyButton from '@/components/BuyButton'
import { sellableCatalogue, catalogueEntry } from '@/lib/documents/catalogue'
import { kindLabel, stageOf, STAGE_LABEL } from '@/lib/documents/journey'
import {
  formatPrice, SINGLE_DOCUMENT_PRICE, categoryPacks, everythingPacks, VAT_NOTE,
} from '@/lib/documents/pricing'
import { DOCUMENT_STATUS, DOCUMENT_DISCLAIMER } from '@/lib/documents/status'

// A page for each document.
//
// Nobody searches for a shop. They search for "spa manager job description
// template" and "spa legionella risk assessment", and until now the only
// answer this site had was one URL carrying five hundred and sixty titles,
// which ranks for none of them and gives an assistant nothing specific to
// cite.
//
// Not every document gets one. The ones that do are the ones somebody
// actually types: job descriptions, policies, risk assessments, checklists,
// the safety plans and the reports. Four hundred and fifty procedures with
// names like "Apply Buffers and Setup Times" would be five hundred thin pages
// competing with each other, which is how a site teaches a search engine that
// it publishes filler.

const BASE = 'https://talenthousecollective.co.uk'

/** The kinds worth a page of their own, because somebody searches for them. */
const WORTH_A_PAGE = new Set([
  'Job description', 'Policy', 'Risk assessment', 'Checklist', 'Guide', 'Training',
  'Operating procedure', 'Emergency plan', 'Management report', 'Safe system of work',
])

export const dynamicParams = false

const pageable = () =>
  sellableCatalogue().filter(entry => WORTH_A_PAGE.has(kindLabel(entry.reference)))

export function generateStaticParams() {
  return pageable().map(entry => ({ reference: entry.reference }))
}

const packsFor = (reference: string) =>
  [...categoryPacks(), ...everythingPacks()].filter(pack => pack.includes(reference))

export async function generateMetadata(
  { params }: { params: Promise<{ reference: string }> },
): Promise<Metadata> {
  const { reference } = await params
  const entry = catalogueEntry(reference)
  if (!entry) return { title: 'Not found' }

  const kind = kindLabel(reference)
  const title = `${entry.title}: spa ${kind.toLowerCase()} template | Talent House Collective`
  const description =
    `${entry.title}. A professional spa ${kind.toLowerCase()} template for ${entry.department.toLowerCase()}, `
    + `to review, amend and sign off. ${formatPrice(SINGLE_DOCUMENT_PRICE)}.`
  return {
    title: { absolute: title.slice(0, 70) },
    description: description.slice(0, 158),
    alternates: { canonical: `${BASE}/standards/${reference}` },
    openGraph: {
      type: 'website',
      url: `${BASE}/standards/${reference}`,
      title: entry.title,
      description: description.slice(0, 158),
      images: [{ url: `${BASE}/images/standards/operating-procedure.jpg`, width: 620, height: 877, alt: entry.title }],
    },
    twitter: { card: 'summary_large_image', title: entry.title, description: description.slice(0, 158) },
  }
}

export default async function DocumentPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const entry = catalogueEntry(reference)
  if (!entry || !WORTH_A_PAGE.has(kindLabel(reference))) notFound()

  const kind = kindLabel(reference)
  const packs = packsFor(reference)
  const cheapest = packs.length ? packs.reduce((a, b) => (a.price <= b.price ? a : b)) : null
  const stage = STAGE_LABEL[stageOf(entry) as keyof typeof STAGE_LABEL]

  const alike = sellableCatalogue()
    .filter(other => other.reference !== reference
      && kindLabel(other.reference) === kind
      && other.department === entry.department)
    .slice(0, 8)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: entry.title,
    sku: entry.reference,
    category: `Spa ${kind}`,
    description: `${entry.title}. A spa ${kind.toLowerCase()} template for ${entry.department.toLowerCase()}. ${DOCUMENT_STATUS}`,
    brand: { '@type': 'Brand', name: 'Talent House Collective' },
    offers: {
      '@type': 'Offer',
      price: (SINGLE_DOCUMENT_PRICE / 100).toFixed(2),
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      url: `${BASE}/standards/${reference}`,
    },
  }

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Standards', item: `${BASE}/standards` },
      ...(cheapest
        ? [{ '@type': 'ListItem', position: 2, name: cheapest.name, item: `${BASE}/standards/packs/${cheapest.slug}` }]
        : []),
      { '@type': 'ListItem', position: cheapest ? 3 : 2, name: entry.title, item: `${BASE}/standards/${reference}` },
    ],
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

        <section className="border-b border-[#dddddd]">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <p className="text-[12px] text-[#6b6b6b]">
              <Link href="/standards" className="underline underline-offset-2">Standards</Link>
              {cheapest && (
                <>
                  {' / '}
                  <Link href={`/standards/packs/${cheapest.slug}`} className="underline underline-offset-2">
                    {cheapest.name}
                  </Link>
                </>
              )}
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">
              Spa {kind}
            </p>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.1] text-[#1c1c1c] md:text-[42px]">
              {entry.title}
            </h1>
            <p className="mt-4 text-[13px] text-[#6b6b6b]">
              {entry.reference} · {entry.department}{stage ? ` · ${stage}` : ''}
            </p>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#3a3a3a]">
              {entry.why}
            </p>
            <p className="mt-6 font-serif text-[32px] leading-none text-[#1c1c1c]">
              {formatPrice(SINGLE_DOCUMENT_PRICE)}
            </p>
            <p className="mt-1.5 text-[13px] text-[#6b6b6b]">On its own. {VAT_NOTE}</p>
            <div className="mt-6">
              <BuyButton reference={entry.reference} label={`Buy this ${kind.toLowerCase()}`} primary />
            </div>
          </div>
        </section>

        {packs.length > 0 && (
          <section className="border-b border-[#dddddd] bg-[#f1f1f1]">
            <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
              <h2 className="text-[20px] font-semibold text-[#1c1c1c]">It also comes in these</h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
                Almost nobody needs one document on its own. Each of these carries this one and everything
                that goes with it.
              </p>
              <ul className="mt-5 space-y-3">
                {packs.slice(0, 5).map(pack => (
                  <li key={pack.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <Link href={`/standards/packs/${pack.slug}`}
                      className="text-[15px] font-medium text-[#1c1c1c] underline underline-offset-2">
                      {pack.name}
                    </Link>
                    <span className="text-[13px] text-[#6b6b6b]">
                      {pack.count} documents · <span className="text-[#1c1c1c]">{formatPrice(pack.price)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="border-b border-[#dddddd]">
          <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
            <h2 className="text-[20px] font-semibold text-[#1c1c1c]">What this is, and what it is not</h2>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[#555555]">{DOCUMENT_DISCLAIMER}</p>
          </div>
        </section>

        {alike.length > 0 && (
          <section className="bg-[#f1f1f1]">
            <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
              <h2 className="text-[20px] font-semibold text-[#1c1c1c]">
                Other {kind.toLowerCase()}s for {entry.department.toLowerCase()}
              </h2>
              <ul className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2">
                {alike.map(other => (
                  <li key={other.reference} className="text-[14px] text-[#1c1c1c]">
                    <Link href={`/standards/${other.reference}`} className="hover:underline">{other.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
