import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { departmentPacks, tierPacks, formatPrice, SINGLE_DOCUMENT_PRICE, VAT_NOTE } from '@/lib/documents/pricing'
import TierBuy from '@/components/TierBuy'
import { LIBRARY_PLAN, TIER_LABEL } from '@/lib/documents/library-plan'
import StandardsCatalogue from '@/components/StandardsCatalogue'

// The shop.
//
// Public, and deliberately not inside the property workspace. A spa director
// who wants a risk assessment is not going to register for a talent platform
// first, and asking her to is asking somebody to join a club to buy a book.
//
// What it sells is not files. It is the thing a spa manager does not have
// time to write and cannot buy anywhere sensible: procedures with an
// auditable standard against every step, written by somebody who has run
// these departments.

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

export default function StandardsPage() {
  const tiers = tierPacks()
  const departments = departmentPacks()
  const dayOne = tiers.find(pack => pack.slug === 'before-the-first-guest')

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content" className="pt-[76px]">

        <section className="border-b border-[#dddddd]">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6b6b6b]">Standards</p>
            <h1 className="mt-3 max-w-3xl text-[38px] font-semibold leading-[1.08] text-[#1c1c1c] md:text-[48px]">
              The documents your spa should already have
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-[#3a3a3a]">
              Standard operating procedures, risk assessments, checklists and job descriptions for every
              department in a luxury spa. Written by people who have run these departments, with an auditable
              standard against every single step, and ready for your name and your sign-off.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#555555]">
              Buy one. Buy a department. Or buy everything a spa needs written down before it opens its doors.
            </p>
            {/* Said before the checkout, not discovered at it. An account is
                where the documents are kept, which is the reason for it: a
                procedure bought once is referred to for years, and a library
                that lives in one email is a library that goes with the inbox
                when somebody changes job. */}
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#6b6b6b]">
              You will need an account, which takes four fields. Everything you buy is kept in it, so it is still
              there next year when a new manager asks where the procedure is.
            </p>
          </div>
        </section>

        <section className="border-b border-[#dddddd] bg-[#f1f1f1]">
          <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">What you get</h2>
            <div className="mt-7 grid gap-x-12 gap-y-8 md:grid-cols-3">
              {[
                ['A standard against every step',
                  'Not a description of what happens. A standard somebody can audit: what must be true, by when, recorded where.'],
                ['The governance an assessor asks for',
                  'A reference, a version, an owner, an approver and a review date. Plus a competency sign-off your trainer completes with the learner in front of them.'],
                ['Yours to amend',
                  'Every document is a professional template for your property to review, adapt and sign off. The blanks are deliberate: they are the facts only you have.'],
              ].map(([heading, detail]) => (
                <div key={heading} className="border-t border-[#1c1c1c] pt-5">
                  <h3 className="text-[15px] font-semibold text-[#1c1c1c]">{heading}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#555555]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#dddddd]">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
            <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">Ways to buy</h2>

            {dayOne && (
              <div className="mt-8 border-2 border-[#1c1c1c] p-7 md:p-9">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">
                      The pre-opening suite
                    </p>
                    <h3 className="mt-2 text-[26px] font-semibold leading-tight text-[#1c1c1c]">{dayOne.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#3a3a3a]">{dayOne.blurb}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-serif text-[38px] leading-none text-[#1c1c1c]">{formatPrice(dayOne.price)}</p>
                    <p className="mt-1.5 text-[12px] text-[#6b6b6b]">{dayOne.count} documents</p>
                  </div>
                </div>
                <p className="mt-5 border-t border-[#dddddd] pt-4 text-[13px] leading-relaxed text-[#555555]">
                  A consultancy writes this over months and charges five figures for it. This is the same work,
                  done once, properly, and sold at a price a spa director can approve without a board meeting.
                </p>
                <TierBuy slug="before-the-first-guest" label="Buy the pre-opening suite" />
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: 'A single document',
                  price: formatPrice(SINGLE_DOCUMENT_PRICE),
                  detail: 'The one procedure you need, today. Roughly what it costs to have somebody senior write it, without losing them for a day.',
                  meta: 'Any document in the library',
                },
                {
                  name: 'A department',
                  price: formatPrice(departments[0]?.price || 0),
                  detail: 'Every procedure, checklist and standard for one team. Priced at whichever is cheaper: the pack, or its documents bought singly.',
                  meta: `${departments.length} departments`,
                },
                {
                  name: tiers[1]?.name || 'The complete library',
                  price: formatPrice(tiers[1]?.price || 0),
                  detail: 'Everything, across every department and every stage of the operation, including governance and audit.',
                  meta: `${LIBRARY_PLAN.length} documents`,
                },
              ].map(card => (
                <div key={card.name} className="border border-[#dddddd] p-6">
                  <h3 className="text-[16px] font-semibold text-[#1c1c1c]">{card.name}</h3>
                  <p className="mt-3 font-serif text-[30px] leading-none text-[#1c1c1c]">{card.price}</p>
                  <p className="mt-1.5 text-[12px] text-[#6b6b6b]">{card.meta}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#555555]">{card.detail}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[12px] text-[#6b6b6b]">{VAT_NOTE}</p>
          </div>
        </section>

        <StandardsCatalogue />

        <section className="border-b border-[#dddddd] bg-[#f1f1f1]">
          <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">
              What these are, and what they are not
            </h2>
            <div className="mt-6 space-y-5 text-[14px] leading-relaxed text-[#3a3a3a]">
              <p>
                Every document is issued as a professional template for your property to review, amend and adopt.
                It is not a completed assessment, a certification, or legal advice, and it does not discharge any
                duty you owe as an employer.
              </p>
              <p>
                A risk assessment in particular is a legal document completed by a competent person who knows
                your premises. What you are buying is the structure to work from: the hazards, the controls and
                the review discipline. It is not valid until a named competent person has completed, dated and
                signed it.
              </p>
              <p className="text-[#555555]">
                That is not small print. It is the difference between a document that helps you and one that
                lets you stop thinking.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
            <h2 className="text-[26px] font-semibold text-[#1c1c1c] md:text-[30px]">
              Not sure which you need?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#555555]">
              Tell us the department and what is going wrong in it, and we will tell you which documents would
              actually help. If the answer is none, we will say so.
            </p>
            <Link href="/contact"
              className="mt-7 inline-block border border-[#1c1c1c] bg-[#1c1c1c] px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[.1em] text-white">
              Ask us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
