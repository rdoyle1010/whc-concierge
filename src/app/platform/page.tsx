import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CandidateProfileMockup from '@/components/homepage-mockups/CandidateProfileMockup'
import MatchScoreMockup from '@/components/homepage-mockups/MatchScoreMockup'
import RoleListingMockup from '@/components/homepage-mockups/RoleListingMockup'

// The page an operator is sent before a conversation.
//
// Everything on this platform already existed as its own page: Roles, Agency,
// Residency, Academy, Standards, Intelligence, Consultancy. What did not exist
// was a page that says they are one product. A hotel group deciding whether to
// put their spa workforce here does not want eight pages about eight features;
// they want to see the range once, see what it looks like in use, and then
// talk to somebody.
//
// So this is an index, not a pitch. Each line below is the module's own
// description, tightened rather than rewritten, because a suite page that
// promises more than the pages it links to is the fastest way to lose the
// second meeting.

type Module = {
  name: string
  href: string
  line: string
  /** What it does for the property, not for the professional. */
  forTheProperty: string
}

const MODULES: Module[] = [
  {
    name: 'Roles',
    href: '/jobs',
    line: 'Permanent roles at five-star hotels, country estates and boutique wellness centres.',
    forTheProperty: 'Matched on skills, qualifications and travel practicality rather than CV keywords.',
  },
  {
    name: 'Agency',
    href: '/agency/about',
    line: 'Verified freelance therapists for last-minute shifts, cover and seasonal work.',
    forTheProperty: 'Radius search by postcode, availability that fits the whole shift, one transparent fee.',
  },
  {
    name: 'Residency',
    href: '/residency',
    line: 'Verified specialists for seasonal cover, retreats, pop-ups and multi-month programmes.',
    forTheProperty: 'Terms, payments and payouts held on the platform for the length of the placement.',
  },
  {
    name: 'Academy',
    href: '/academy',
    line: 'CPD-certified courses in treatment craft, guest experience, retail and spa management.',
    forTheProperty: 'Training that shows on a profile as a verified certificate, so it can be checked.',
  },
  {
    name: 'Standards',
    href: '/standards',
    line: 'Procedures with an auditable standard against every step.',
    forTheProperty: 'Written by people who have run spa departments, and priced per document.',
  },
  {
    name: 'Intelligence',
    href: '/intelligence',
    line: 'Salary signals and hiring demand for luxury spa and wellness.',
    forTheProperty: 'Drawn from live platform data rather than from a survey taken last year.',
  },
  {
    name: 'Consultancy',
    href: '/consultancy',
    line: 'Independent consultants, wellness designers and operators.',
    forTheProperty: 'For projects, openings and turnarounds, with published specialisms.',
  },
]

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      <main id="main-content">
        {/* One sentence about the whole thing, and a way to start a conversation.
            The secondary route is pricing rather than sign-up: somebody reading
            this page is deciding whether to buy, not whether to join. */}
        <section className="border-b border-border bg-parchment">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8 lg:py-28">
            <p className="eyebrow">The platform</p>
            <h1 className="section-heading mt-4">
              Every role, shift and qualification in your spa, in one place.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-secondary">
              Hiring, flexible cover, residencies, training, operating standards and market data for
              luxury spa and wellness teams. One platform, and one set of people whose right to work,
              insurance and qualifications have already been checked.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact?type=demo" className="btn-primary">Book a demo</Link>
              <Link href="/pricing" className="btn-secondary">See pricing</Link>
            </div>
          </div>
        </section>

        {/* The range, once. Seven cards rather than seven pages of prose. */}
        <section className="border-b border-border bg-white" aria-label="What is on the platform">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <h2 className="text-[26px] md:text-[32px] text-ink">Seven things, one account.</h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-secondary">
              A property uses the ones it needs. The people, the verification and the records are
              shared across all of them, so a therapist hired through Roles and booked again through
              Agency is the same verified person, with the same history.
            </p>

            <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map(module => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex flex-col bg-white p-7 transition-colors hover:bg-surface"
                >
                  <h3 className="text-[19px] font-medium text-ink">{module.name}</h3>
                  <p className="mt-2.5 text-[13px] leading-6 text-secondary">{module.line}</p>
                  <p className="mt-2 text-[12.5px] leading-6 text-muted">{module.forTheProperty}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent">
                    Find out more
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}

              {/* Seven cards in three columns leave a stranded empty cell, which
                  reads as a page that has broken rather than a range that is
                  deliberate. The eighth slot is the conversation. */}
              <div className="flex flex-col bg-surface p-7 lg:col-span-2">
                <p className="eyebrow">For multi-site groups</p>
                <h3 className="mt-2.5 text-[19px] font-medium text-ink">More than one property?</h3>
                <p className="mt-2.5 text-[13px] leading-6 text-secondary">
                  Tell us how many sites, how many treatment rooms and where the cover gaps are, and
                  the demo is run against that rather than against a sample account.
                </p>
                <Link href="/contact?type=demo" className="btn-primary mt-auto inline-flex self-start pt-2.5">
                  Book a demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Showing it rather than describing it. These three screens already
            existed in the codebase and had never been put on a page. */}
        <section className="border-b border-border bg-parchment" aria-label="What the platform looks like in use">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <h2 className="text-[26px] md:text-[32px] text-ink">What a hiring manager actually sees.</h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-secondary">
              A verified profile, a role as it is advertised, and the reasoning behind a match. The
              score is not a black box: every candidate is shown against the things the role asked for.
            </p>
            <div className="mt-12 grid items-start gap-10 lg:grid-cols-3">
              <figure className="m-0">
                <RoleListingMockup />
                <figcaption className="mt-5 text-[12.5px] leading-6 text-secondary">
                  <span className="font-semibold text-ink">A role as it is advertised.</span> Tier,
                  property, location and salary, so a professional self-selects before applying.
                </figcaption>
              </figure>
              <figure className="m-0">
                <CandidateProfileMockup />
                <figcaption className="mt-5 text-[12.5px] leading-6 text-secondary">
                  <span className="font-semibold text-ink">A verified profile.</span> Right to work,
                  insurance and qualifications reviewed before the Verified mark is given.
                </figcaption>
              </figure>
              <figure className="m-0">
                <MatchScoreMockup />
                <figcaption className="mt-5 text-[12.5px] leading-6 text-secondary">
                  <span className="font-semibold text-ink">Why somebody matched.</span> Weighted and
                  scored against the role, and shown to both sides.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* No invented customers. The reviews on this platform are written by
            the people who did the work, so this points at them rather than
            quoting a logo wall that does not exist yet. */}
        <section className="border-b border-border bg-white" aria-label="Proof">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div>
                <h2 className="text-[26px] md:text-[32px] text-ink">Verification is the product.</h2>
                <p className="mt-4 text-[14px] leading-7 text-secondary">
                  Anybody can list people. The reason a spa director uses this rather than a job board
                  is that right-to-work documents, insurance and qualifications are checked before a
                  profile carries the Verified mark, ratings attach only to work the platform can
                  evidence, and the booking, the agreed terms and the payment stay in one record.
                </p>
                <p className="mt-4 text-[14px] leading-7 text-secondary">
                  That record is what makes a second booking faster than the first, and it is what a
                  multi-site group needs before it will move a workforce onto anything.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/testimonials" className="btn-secondary">Read what people say</Link>
                  <Link href="/good-to-know" className="btn-secondary">How verification works</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-parchment" aria-label="Book a demo">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-8">
            <h2 className="text-[28px] md:text-[36px] text-ink">See it against your own rota.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-secondary">
              Half an hour, your roles and your cover gaps, and an honest answer about whether this
              is worth moving to.
            </p>
            <Link href="/contact?type=demo" className="btn-primary mt-8 inline-flex">Book a demo</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
