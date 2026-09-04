'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Check } from 'lucide-react'
import { CONSULTANCY_SPECIALISMS } from '@/lib/consultancy'

// The front door.
//
// "List your practice" used to drop somebody straight into a long form, or
// into a sign-in wall if they were not already a member. Neither answers the
// question a consultant actually has, which is whether this is worth ten
// minutes of their afternoon. This page answers that first, and only then asks
// for anything.

const STEPS = [
  { n: 1, title: 'Create an account', body: 'One account covers everything on the platform. It takes a minute and costs nothing.' },
  { n: 2, title: 'Build your listing', body: 'Your practice, your specialisms and the projects worth judging you on. About ten minutes.' },
  { n: 3, title: 'We read it, then it goes live', body: 'Every listing is read before it appears, because each one carries the platform’s name alongside yours.' },
]

export default function ConsultancyJoinPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-28 pb-14">
          <p className="eyebrow mb-2">Consultancy</p>
          <h1 className="text-3xl sm:text-[42px] leading-[1.08] font-semibold tracking-tight text-ink max-w-3xl">
            Properties are looking for you. They just have nowhere to look.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-8 text-secondary">
            Spa consultancy is bought on reputation and lost to whoever happened to be recommended that week. The
            Consultancy directory puts the work in front of the properties commissioning it - by specialism, by how the
            work is bought, and by what your projects actually changed.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/login?role=consultant" className="btn-primary inline-flex items-center gap-2 text-[13px]">
              List your practice <ArrowRight size={14} />
            </Link>
            <Link href="/consultancy" className="btn-secondary text-[13px]">Browse the directory</Link>
          </div>
          <p className="mt-3 text-[12px] text-muted">Free to list. No commission on work you win.</p>
        </section>

        <section className="border-y border-border bg-[#f1f1f1]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map(step => (
              <div key={step.n}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{step.n}</span>
                <h2 className="mt-4 text-[17px] font-semibold text-ink">{step.title}</h2>
                <p className="mt-2 text-[13px] leading-7 text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Who it is for</h2>
            <p className="mt-3 text-[14px] leading-7 text-secondary">
              Anyone properties bring in rather than employ. If a hotel would call you about one of these, you belong here.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CONSULTANCY_SPECIALISMS.map(item => (
                <span key={item} className="border border-border px-3 py-1.5 text-[12px] text-secondary">{item}</span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">What it costs</h2>
            <ul className="mt-5 space-y-3">
              {[
                'Listing is free, permanently. Not a trial.',
                'No commission, no finder’s fee, no cut of what you invoice.',
                'Enquiries come to you directly, with the brief, budget band and timing.',
                'Work under NDA can be shown as the property type instead of the name.',
                'Featured placement is optional - top of the directory for thirty days - and nothing is hidden without it.',
              ].map(line => (
                <li key={line} className="flex gap-2.5 text-[13px] leading-7 text-secondary">
                  <Check size={15} className="mt-1.5 shrink-0 text-ink" /> {line}
                </li>
              ))}
            </ul>

            <div className="mt-8 border border-border p-6">
              <p className="eyebrow mb-2">What makes a listing work</p>
              <p className="text-[13px] leading-7 text-secondary">
                A property is buying judgement, and judgement is proved by outcomes. &ldquo;Rebuilt the retail
                calendar&rdquo; is a description. &ldquo;Retail per treatment from £6.10 to £14.40 in two quarters&rdquo;
                is a reason to call you. Bring one project like that and the listing does its job.
              </p>
              <Link href="/login?role=consultant" className="btn-primary mt-6 inline-flex items-center gap-2 text-[13px]">
                List your practice <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
