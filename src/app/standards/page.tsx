import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  formatPrice, cheapestSingle, kindPrices, COMPLETE_LIBRARY_PRICE, POOL_SAFETY_PACK_PRICE, RISK_ASSESSMENT_PACK_PRICE, VAT_NOTE,
  CHECKLIST_PACK_PRICE, FINANCE_PACK_PRICE,
  categoryPacks, everythingPacks,
} from '@/lib/documents/pricing'
import TierBuy from '@/components/TierBuy'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { FREE_SAMPLES } from '@/lib/documents/samples'
import StandardsCatalogue from '@/components/StandardsCatalogue'
import StandardsStickyBuy from '@/components/StandardsStickyBuy'

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
  // A canonical, and an image that is of this page.
  //
  // The openGraph block replaced the parent object rather than merging with
  // it, so the shop had no og:image at all and its twitter card still carried
  // the careers title and the careers image. Every share of this page on
  // LinkedIn or WhatsApp was imageless and described as something else.
  alternates: { canonical: 'https://talenthousecollective.co.uk/standards' },
  openGraph: {
    type: 'website',
    url: 'https://talenthousecollective.co.uk/standards',
    title: 'Spa Standards, SOPs and Risk Assessments',
    description: 'Procedures with an auditable standard against every step, written by people who have run spa departments.',
    images: [{
      url: 'https://talenthousecollective.co.uk/images/standards/risk-matrix.jpg',
      width: 620,
      height: 877,
      alt: 'A five by five risk matrix printed in green, amber and red, from the spa risk assessment suite',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spa Standards, SOPs and Risk Assessments',
    description: 'Procedures with an auditable standard against every step, written by people who have run spa departments.',
    images: ['https://talenthousecollective.co.uk/images/standards/risk-matrix.jpg'],
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
  // What the complete library actually contains, not what the catalogue
  // contains. The hero said "2,450 pounds for all 561" beside a pack holding
  // 504: fifty-seven documents promised at the exact moment somebody decides,
  // and not delivered. The catalogue is the shelf, the pack is the offer, and
  // only one of them is a price.
  // The cheapest document in the library, so "from" is a fact rather than a
  // flat price applied to everything from a cleaning checklist to a pool
  // emergency plan.
  const from = cheapestSingle()
  // Named by what they are rather than by their reference, because nobody
  // clicks REC-ARRIVE-SOP-018.
  const freeReads = FREE_SAMPLES.map(reference => ({
    reference,
    label: catalogue.find(entry => entry.reference === reference)?.title || reference,
  }))
  const completeLibraryCount =
    everythingPacks().find(pack => pack.slug === 'the-complete-library')?.count ?? catalogue.length

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />
      <StandardsStickyBuy from={formatPrice(from)} />
      <main id="main-content" className="pt-[76px]">

        {/* The hero shows a page. Everything else on this site can be
            described; this has to be seen. */}
        <section className="border-b border-[#dcd4c8]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6e6a60]">Standards</p>
              <h1 className="mt-3 text-[36px] font-semibold leading-[1.06] text-[#222321] md:text-[52px]">
                The documents your spa is expected to have
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#3a3832]">
                Operating procedures, emergency plans, risk assessments and checklists for every department in a
                luxury spa. Written by people who have run these departments, with an auditable standard against
                every step.
              </p>
              {/* Held back on a phone. It is a good line and it is the third
                  thing said, which on a 390 pixel screen is the difference
                  between a price being visible and being a scroll away. */}
              <p className="mt-4 hidden max-w-xl text-[15px] leading-relaxed text-[#57544c] sm:block">
                Every blank in them is a fact about your building, and typing it in takes an afternoon. Writing
                them from nothing takes a consultancy and a quarter.
              </p>

              {/* A price in the first screen.
                  The first number on this page used to be roughly six phone
                  screens down, behind a hero, three trust blocks and six
                  full-height photographs of documents. A visitor who cannot
                  tell in ten seconds whether this costs forty pounds or four
                  thousand leaves, and nothing below the fold gets a vote. */}
              <p className="mt-5 text-[15px] leading-relaxed text-[#222321]">
                From <strong className="font-semibold">{formatPrice(from)}</strong> for one
                procedure, <strong className="font-semibold">{formatPrice(COMPLETE_LIBRARY_PRICE)}</strong> for
                the complete library of {completeLibraryCount}. {VAT_NOTE}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="#ways-to-buy"
                  className="inline-flex items-center border border-[#28322b] bg-[#28322b] px-5 py-3 text-[14px] font-semibold text-white">
                  See what it costs
                </Link>
                <Link href="#every-document"
                  className="inline-flex items-center border border-[#28322b] px-5 py-3 text-[14px] font-semibold text-[#222321]">
                  Search all {catalogue.length} documents
                </Link>
              </div>

              {/* Open one, free, here, instead of three numbers in a hairline
                  grid.
                  The numbers were 561, 144 and 61, which are facts about the
                  seller. The question a stranger has is whether the documents
                  are any good, and no number answers it. Three complete ones,
                  one of each shape, no email address asked for. This is the
                  only thing on the page that cannot be faked, and it was the
                  one thing the page did not do. */}
              <div className="mt-9 max-w-lg border-t border-[#28322b] pt-4">
                <p className="text-[13px] font-semibold text-[#222321]">Read three of them first. Free, now, no sign-up.</p>
                <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {freeReads.map(sample => (
                    <li key={sample.reference}>
                      <a href={`/api/standards/sample?reference=${sample.reference}`}
                        target="_blank" rel="noopener"
                        className="text-[13px] font-medium text-[#28322b] underline decoration-1 underline-offset-4 hover:decoration-2">
                        {sample.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[12px] text-[#6e6a60]">
                  Complete, exactly as a buyer receives them. {catalogue.length} more where those came from.
                </p>
              </div>
            </div>

            <div className="relative">
              {/* Two pages, overlapped, so it reads as a document rather than
                  a screenshot. */}
              <div className="relative mx-auto w-full max-w-[420px]">
                <div className="absolute -right-3 top-6 hidden w-[74%] border border-[#dcd4c8] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:block">
                  <Image src="/images/standards/risk-matrix.jpg" alt="" aria-hidden width={620} height={877}
                    className="h-auto w-full" />
                </div>
                <div className="relative w-[86%] border border-[#c7bdae] shadow-[0_26px_60px_-28px_rgba(0,0,0,0.55)]">
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
        <section className="border-b border-[#dcd4c8] bg-[#ede8df]">
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
                <div key={heading} className="border-t-2 border-[#28322b] pt-4">
                  <h2 className="text-[15px] font-semibold text-[#222321]">{heading}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#57544c]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* See inside. The section every competitor cannot write. */}
        <section className="border-b border-[#dcd4c8]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[28px] font-semibold text-[#222321] md:text-[32px]">See inside</h2>
              <p className="max-w-md text-[14px] leading-relaxed text-[#57544c]">
                Real pages from the real documents. Nothing here is a mock-up.
              </p>
            </div>

            {/* Six A4 pages, stacked, is four phone screens of photographs
                between a visitor and a price.
                The pictures are the argument on this page and none of them
                are cut. They swipe on a phone and stay a grid from small
                upwards, so the gallery costs two thirds of a screen instead
                of four. Scroll snapping and no JavaScript: a carousel that
                needs a script is a carousel that is blank while the script
                loads. */}
            <div className="mt-9 -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2
              sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:overflow-visible sm:px-0
              lg:grid-cols-3">
              {SAMPLES.map(sample => (
                <figure key={sample.src} className="w-[74%] shrink-0 snap-start sm:w-auto sm:shrink">
                  <div className="border border-[#dcd4c8] bg-white shadow-[0_14px_34px_-26px_rgba(0,0,0,0.5)]">
                    <Image src={sample.src} alt={sample.alt} width={620} height={877} className="h-auto w-full" />
                  </div>
                  <figcaption className="mt-3.5">
                    <p className="text-[14px] font-semibold text-[#222321]">{sample.caption}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#57544c]">{sample.detail}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            {/* Said, because a row that scrolls sideways with no edge in
                view reads as a row of three on a phone. */}
            <p className="mt-3 text-[12px] text-[#6e6a60] sm:hidden">Swipe to see all {SAMPLES.length}.</p>
          </div>
        </section>

        {/* Ways to buy, above the long list rather than below three screens
            of prose. */}
        <section className="border-b border-[#dcd4c8] bg-[#ede8df]" id="ways-to-buy">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-[28px] font-semibold text-[#222321] md:text-[32px]">Ways to buy</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#57544c]">
              You will need an account, which takes four fields. Everything you buy is kept in it, so it is
              still there next year when a new manager asks where the procedure is. {VAT_NOTE}
            </p>

            <div className="mt-9 grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col border border-[#28322b] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">If you have water</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#222321]">
                  Spa Safety Operating Procedure
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#222321]">
                  {formatPrice(POOL_SAFETY_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3832]">
                  Both halves, as the regulations expect them. The Normal Operating Procedure setting out how the
                  whole spa runs on an ordinary day, and the Emergency Action Plan setting out who does what in
                  the first minutes of an emergency, one emergency to a page.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#57544c]">
                  {[
                    '78 pages of operating procedure, 13 parts',
                    '66 pages of emergency plan, 46 emergencies',
                    'The guide to completing them, free',
                    'The guide to training your team on them, free',
                    'Fourteen blank record sheets, ready to print',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#222321]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="pool-safety" label="Buy the safety procedure" />
              </div>

              <div className="flex flex-col border border-[#28322b] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">The legal ones</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#222321]">
                  Spa Risk Assessment Suite
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#222321]">
                  {formatPrice(RISK_ASSESSMENT_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3832]">
                  Thirteen assessments organised by hazard type, which is how an inspector reads one. Sixty-one
                  hazards, each with the controls a competent operation would expect to find, and nothing scored
                  for you.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#57544c]">
                  {[
                    'COSHH, electrical, fire, infection control and water hygiene',
                    'Manual handling, work at height, slips, noise and heat',
                    'Lone working, violence, ergonomics and vulnerable persons',
                    'Pool, cold plunge, hydrotherapy and thermal suite',
                    'Colour-coded matrix, method and action plan',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#222321]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="risk-assessments" label="Buy the risk assessment suite" />
              </div>

              {/* The two that come after the procedures rather than before
                  them. A spa with the procedures still runs the day off a
                  sheet somebody printed in 2019 and still argues about how
                  utilisation was calculated. */}
              <div className="flex flex-col border border-[#28322b] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">How the day is run</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#222321]">
                  Daily Running Checklists
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#222321]">
                  {formatPrice(CHECKLIST_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3832]">
                  Nine sheets covering every shift a spa runs, drawn from the procedures, assessments and
                  policies rather than written from scratch. Each block names its source, so a change to one
                  procedure can be traced to every checklist it affects.
                </p>
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#57544c]">
                  {[
                    'Reception: opening, mid shift and close',
                    'Therapist: opening and closing, by room',
                    'Cleaning: opening and closing, including the deep work',
                    'Duty manager: a walk, not a desk exercise',
                    'Weekly: maintenance, safety, certification and training',
                    'Stop checks that decide whether an area opens at all',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#222321]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="daily-checklists" label="Buy the checklists" />
              </div>

              <div className="flex flex-col border border-[#28322b] bg-white p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">What it is earning</p>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight text-[#222321]">
                  Spa Financial Reporting Pack
                </h3>
                <p className="mt-1.5 font-serif text-[32px] leading-none text-[#222321]">
                  {formatPrice(FINANCE_PACK_PRICE)}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3a3832]">
                  Twenty reports, the Excel workbook that computes them, and the definitions behind both. What a
                  spa director lacks is rarely a spreadsheet: it is agreement on which numbers, measured how,
                  compared against what, and what somebody does when one of them moves.
                </p>
                {/* The workbook was not mentioned anywhere on this page, on
                    the one pack whose strongest claim is that it is a working
                    spreadsheet rather than a picture of one. A differentiator
                    nobody is told about is a differentiator nobody pays for. */}
                <ul className="mt-4 space-y-1.5 text-[13px] text-[#57544c]">
                  {[
                    'An Excel workbook of 21 sheets: fill in eight numbers and the rest calculates',
                    'A director dashboard of fifteen measures, each drilling into a report',
                    'Revenue against capacity, not only against budget: RevPATH and unsold hours',
                    'Forward pace at 7, 14, 30 and 90 days against the same point last year',
                    'Contribution per hour by treatment, which reorders most menus',
                    'Discount and yield, including discount by approver',
                    'Every line defined so two people cannot compute it differently',
                  ].map(line => (
                    <li key={line} className="flex gap-2"><span className="text-[#222321]">·</span><span>{line}</span></li>
                  ))}
                </ul>
                <TierBuy slug="financial-reporting" label="Buy the reporting pack" />
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: 'A single document',
                  price: `From ${formatPrice(from)}`,
                  detail: 'The one you need, today. Search the library below and buy it from the list. Priced by what it is: a procedure is ten pounds, a risk assessment is seventy-five.',
                  href: '#every-document',
                  cta: 'Find it',
                },
                {
                  name: 'One part of the operation',
                  // Worked out from the packs rather than typed, so the card
                  // cannot drift away from the prices below it.
                  price: `From ${formatPrice(Math.min(...categoryPacks().map(pack => pack.price)))}`,
                  detail: 'Risk assessments, the reporting pack, the guest journey end to end, recruitment, training, safety, or how the day is run. Everything that part needs in writing, across every team it touches.',
                  href: '#packs',
                  cta: `See all ${categoryPacks().length}`,
                },
                {
                  name: 'Before the first guest',
                  price: formatPrice(149500),
                  detail: 'Everything a spa needs written down before it opens its doors. A consultancy writes this over months and charges five figures.',
                  href: '#departments',
                  cta: 'See the suite',
                },
              ].map(card => (
                <div key={card.name} className="flex flex-col border border-[#dcd4c8] bg-white p-6">
                  <h3 className="text-[16px] font-semibold text-[#222321]">{card.name}</h3>
                  <p className="mt-1.5 font-serif text-[26px] leading-none text-[#222321]">{card.price}</p>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-[#57544c]">{card.detail}</p>
                  <Link href={card.href} className="mt-4 text-[13px] font-semibold text-[#28322b] underline">
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
        <section className="bg-[#ede8df]">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">
              What these are, and what they are not
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#3a3832]">
              Every document is issued as a professional template for your property to review, amend and adopt.
              It is not a completed assessment, a certification, or legal advice, and it does not discharge any
              duty you owe as an employer.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3832]">
              A risk assessment in particular is a legal document completed by a competent person who knows your
              premises. What you are buying is the structure to work from: the hazards, the controls and the
              review discipline. It is not valid until a named competent person has completed, dated and signed
              it.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3832]">
              These are written to practice in the United Kingdom. If your property is elsewhere, the equivalent
              framework applies and the documents must be checked against it before use.
            </p>
            {/* Said at this size deliberately. This is not small print, and
                a spa that discovers after paying that it has bought a
                template rather than a finished assessment is a refund and a
                review, and rightly so. */}
            <p className="mt-4 text-[15px] leading-relaxed text-[#3a3832]">
              That is not small print. It is the difference between what you are buying and what you still have
              to do, and you should know it before you pay rather than after.
            </p>
            <p className="mt-6 text-[14px] text-[#57544c]">
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
