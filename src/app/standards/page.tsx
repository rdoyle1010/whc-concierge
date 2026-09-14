import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  formatPrice, SINGLE_DOCUMENT_PRICE, POOL_SAFETY_PACK_PRICE, RISK_ASSESSMENT_PACK_PRICE, VAT_NOTE,
  journeyPacks,
} from '@/lib/documents/pricing'
import TierBuy from '@/components/TierBuy'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import StandardsCatalogue from '@/components/StandardsCatalogue'

// The shop, rebuilt around the thing it is selling.
//
// The first version was three screens of prose before a buyer saw a price and
// not one image on it. That is a page for somebody who has already decided.
// A spa director arrives having been told nothing and leaves in nine seconds,
// and the only thing that stops them is seeing what they would get.
//
// So the pictures are the documents. Real pages, rendered from the real
// files: the risk matrix in colour, a cardiac arrest page, the emergency
// contacts page, a blank water test log. Every competitor selling document
// packs uses a photograph of a candle, for the same reason they cannot show
// you a page.

export const metadata: Metadata = {
  title: { absolute: 'Spa Standards, SOPs and Risk Assessments | Talent House Collective' },
  description:
    'Professional standard operating procedures, risk assessments, checklists and job descriptions for luxury '
    + 'spa and wellness operations. Buy a single document, a department, or the full pre-opening suite.',
  openGraph: {
    title: 'Spa Standards, SOPs and Risk Assessments',
    description: 'Procedures with an auditable standard against every step, written by people who have run spa departments.',
  },
}

const SAMPLES = [
  {
    src: '/images/standards/emergency-page.jpg',
    alt: 'A page from the Emergency Action Plan covering cardiac arrest, with seven numbered actions and a blank column for who does each one',
    caption: 'One emergency to a page',
    detail: 'Read at speed, with wet hands. Who does what is yours to assign.',
  },
  {
    src: '/images/standards/risk-matrix.jpg',
    alt: 'A five by five risk matrix printed in green, amber and red, with the score in every cell',
    caption: 'Scored by you, in colour',
    detail: 'The matrix is read by colour before it is read by number.',
  },
  {
    src: '/images/standards/operating-procedure.jpg',
    alt: 'A page from the Normal Operating Procedure showing a facilities table with empty fields to complete',
    caption: 'Every fact is a form field',
    detail: 'Type into it in the free Adobe Reader. Nothing to buy, nothing to ask us for.',
  },
  {
    src: '/images/standards/hazard-block.jpg',
    alt: 'A hazard block listing controls with tick boxes and blank fields for likelihood, severity and score',
    caption: 'Controls you tick, not claims we make',
    detail: 'We do not assert that your flooring is non-slip. You confirm it.',
  },
  {
    src: '/images/standards/emergency-contacts.jpg',
    alt: 'The emergency contacts page listing who to call, with blank fields for each number',
    caption: 'Your numbers, not ours',
    detail: '999 is the only number stated anywhere in it.',
  },
  {
    src: '/images/standards/record-sheet.jpg',
    alt: 'A blank daily water test record sheet with columns for date, time, readings and who tested',
    caption: 'The blank sheets, included',
    detail: 'Fourteen record sheets, ready to print. The system, not a description of one.',
  },
]

export default function StandardsPage() {
  const catalogue = sellableCatalogue()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content" className="pt-[76px]">

        {/* The hero shows a page. Everything else on this site can be
            described; this has to be seen. */}
        <section className="border-b border-[#dddddd]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6b6b6b]">Standards</p>
              <h1 className="mt-3 text-[36px] font-semibold leading-[1.06] text-[#1c1c1c] md:text-[52px]">
                The documents your spa is expected to have
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#3a3a3a]">
                Operating procedures, emergency plans, risk assessments and checklists for every department in a
                luxury spa. Written by people who have run these departments, with an auditable standard against
                every step.
              </p>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#555555]">
                Every blank in them is a fact about your building, and typing it in takes an afternoon. Writing
                them from nothing takes a consultancy and a quarter.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="#ways-to-buy"
                  className="inline-flex items-center border border-[#1c1c1c] bg-[#1c1c1c] px-5 py-3 text-[14px] font-semibold text-white">
                  See what it costs
                </Link>
                <Link href="#every-document"
                  className="inline-flex items-center border border-[#1c1c1c] px-5 py-3 text-[14px] font-semibold text-[#1c1c1c]">
                  Search all {catalogue.length} documents
                </Link>
              </div>

              <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px border border-[#dddddd] bg-[#dddddd]">
                {[
                  [`${catalogue.length}`, 'documents'],
                  ['144', 'pages of safety procedure'],
                  ['61', 'hazards assessed'],
                ].map(([value, label]) => (
                  <div key={label} className="bg-white px-4 py-3.5">
                    <dt className="font-serif text-[24px] leading-none text-[#1c1c1c]">{value}</dt>
                    <dd className="mt-1.5 text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              {/* Two pages, overlapped, so it reads as a document rather than
                  a screenshot. */}
              <div className="relative mx-auto w-full max-w-[420px]">
                <div className="absolute -right-3 top-6 hidden w-[74%] border border-[#dddddd] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:block">
                  <Image src="/images/standards/risk-matrix.jpg" alt="" aria-hidden width={620} height={877}
                    className="h-auto w-full" />
                </div>
                <div className="relative w-[86%] border border-[#c9c9c9] shadow-[0_26px_60px_-28px_rgba(0,0,0,0.55)]">
                  <Image
                    src="/images/standards/emergency-page.jpg"
                    alt="A page from the Emergency Action Plan covering cardiac arrest, with numbered actions and a blank column for who does each one"
                    width={620} height={877} priority className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What it is, in three lines rather than three paragraphs. */}
        <section className="border-b border-[#dddddd] bg-[#f1f1f1]">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
            <div className="grid gap-x-12 gap-y-8 md:grid-cols-3">
              {[
                ['A standard against every step',
                  'Not a description of what happens. What must be true, by when, recorded where.'],
                ['The governance an assessor asks for',
                  'A reference, a version, an owner, a review date, and a competency sign-off your trainer completes.'],
                ['Yours to complete, not ours to invent',
                  'Every blank is a fact about your building. A muster point we made up would be believed, and wrong.'],
              ].map(([heading, detail]) => (
                <div key={heading} className="border-t-2 border-[#1c1c1c] pt-4">
                  <h2 className="text-[15px] font-semibold text-[#1c1c1c]">{heading}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#555555]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* See inside. The section every competitor cannot write. */}
        <section className="border-b border-[#dddddd]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">See inside</h2>
              <p className="max-w-md text-[14px] leading-relaxed text-[#555555]">
                Real pages from the real documents. Nothing here is a mock-up.
              </p>
            </div>

            <div className="mt-9 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLES.map(sample => (
                <figure key={sample.src}>
                  <div className="border border-[#dddddd] bg-white shadow-[0_14px_34px_-26px_rgba(0,0,0,0.5)]">
                    <Image src={sample.src} alt={sample.alt} width={620} height={877} className="h-auto w-full" />
                  </div>
                  <figcaption className="mt-3.5">
                    <p className="text-[14px] font-semibold text-[#1c1c1c]">{sample.caption}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#555555]">{sample.detail}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Ways to buy, above the long list rather than below three screens
            of prose. */}
        <section className="border-b border-[#dddddd] bg-[#f1f1f1]" id="ways-to-buy">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">Ways to buy</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
              You will need an account, which takes four fields. Everything you buy is kept in it, so it is
              still there next year when a new manager asks where the procedure is. {VAT_NOTE}
            </p>

            <div className="mt-9 grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col border border-[#1c1c1c] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">If you have water</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#1c1c1c]">
                  Spa Safety Operating Procedure
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#1c1c1c]">
                  {formatPrice(POOL_SAFETY_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3a3a]">
                  Both halves, as the regulations expect them. The Normal Operating Procedure setting out how the
                  whole spa runs on an ordinary day, and the Emergency Action Plan setting out who does what in
                  the first minutes of an emergency, one emergency to a page.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#555555]">
                  {[
                    '78 pages of operating procedure, 13 parts',
                    '66 pages of emergency plan, 46 emergencies',
                    'The guide to completing them, free',
                    'The guide to training your team on them, free',
                    'Fourteen blank record sheets, ready to print',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#1c1c1c]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="pool-safety" label="Buy the safety procedure" />
              </div>

              <div className="flex flex-col border border-[#1c1c1c] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">The legal ones</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#1c1c1c]">
                  Spa Risk Assessment Suite
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#1c1c1c]">
                  {formatPrice(RISK_ASSESSMENT_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3a3a]">
                  Thirteen assessments organised by hazard type, which is how an inspector reads one. Sixty-one
                  hazards, each with the controls a competent operation would expect to find, and nothing scored
                  for you.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#555555]">
                  {[
                    'COSHH, electrical, fire, infection control and water hygiene',
                    'Manual handling, work at height, slips, noise and heat',
                    'Lone working, violence, ergonomics and vulnerable persons',
                    'Pool, cold plunge, hydrotherapy and thermal suite',
                    'Colour-coded matrix, method and action plan',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#1c1c1c]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="risk-assessments" label="Buy the risk assessment suite" />
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: 'A single document',
                  price: formatPrice(SINGLE_DOCUMENT_PRICE),
                  detail: 'The one procedure you need, today. Search the library below and buy it from the list.',
                  href: '#every-document',
                  cta: 'Find it',
                },
                {
                  name: 'A stage of the visit',
                  // Worked out from the packs rather than typed, so the card
                  // cannot drift away from the prices below it.
                  price: `From ${formatPrice(Math.min(...journeyPacks().map(pack => pack.price)))}`,
                  detail: 'Everything one part of the guest journey needs in writing, across every team it touches. Arrivals, the visit itself, departures, or what happens afterwards.',
                  href: '#stages',
                  cta: 'See the six stages',
                },
                {
                  name: 'Before the first guest',
                  price: formatPrice(149500),
                  detail: 'Everything a spa needs written down before it opens its doors. A consultancy writes this over months and charges five figures.',
                  href: '#departments',
                  cta: 'See the suite',
                },
              ].map(card => (
                <div key={card.name} className="flex flex-col border border-[#dddddd] bg-white p-6">
                  <h3 className="text-[16px] font-semibold text-[#1c1c1c]">{card.name}</h3>
                  <p className="mt-1.5 font-serif text-[26px] leading-none text-[#1c1c1c]">{card.price}</p>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-[#555555]">{card.detail}</p>
                  <Link href={card.href} className="mt-4 text-[13px] font-semibold text-[#1c1c1c] underline">
                    {card.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <StandardsCatalogue />

        {/* What these are and are not. It stays, because selling somebody a
            risk assessment without it would be the thing to regret. */}
        <section className="bg-[#f1f1f1]">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">
              What these are, and what they are not
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#3a3a3a]">
              Every document is issued as a professional template for your property to review, amend and adopt.
              It is not a completed assessment, a certification, or legal advice, and it does not discharge any
              duty you owe as an employer.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3a3a]">
              A risk assessment in particular is a legal document completed by a competent person who knows your
              premises. What you are buying is the structure to work from: the hazards, the controls and the
              review discipline. It is not valid until a named competent person has completed, dated and signed
              it.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3a3a]">
              These are written to practice in the United Kingdom. If your property is elsewhere, the equivalent
              framework applies and the documents must be checked against it before use.
            </p>
            {/* Said at this size deliberately. This is not small print, and
                a spa that discovers after paying that it has bought a
                template rather than a finished assessment is a refund and a
                review, and rightly so. */}
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3a3a]">
              That is not small print. It is the difference between what you are buying and what you still have
              to do, and you should know it before you pay rather than after.
            </p>
            <p className="mt-6 text-[14px] text-[#555555]">
              Not sure what you need? <Link href="/contact" className="underline">Tell us what your spa has</Link>{' '}
              and we will say which of these covers it.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
