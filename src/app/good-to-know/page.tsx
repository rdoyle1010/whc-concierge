import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react'
import { INDUSTRY_GROUPS, TOTAL_BODIES, type IndustryBody } from '@/lib/industry-bodies'

export const revalidate = 3600

export const metadata: Metadata = {
  title: { absolute: 'Good to Know | Spa Industry Bodies, Insurance and Standards | Talent House Collective' },
  description: 'The organisations that govern, insure, qualify and report on the UK spa and wellness industry, and why each one matters to your career or your spa.',
  openGraph: {
    title: 'Good to Know | Spa Industry Bodies, Insurance and Standards',
    description: 'Professional bodies, awarding organisations, safety regulators and trade press for spa and wellness professionals.',
  },
}

// Initials, drawn rather than photographed.
//
// A reference page whose entire value is trustworthiness cannot borrow other
// organisations' photography, and an empty box reads as unfinished. A monogram
// in the house palette reads as a decision - and the moment Talent House owns
// a real photograph, `image` on the entry replaces it with no other change.
function monogram(body: IndustryBody) {
  if (body.shortName) return body.shortName.slice(0, 4)
  const words = body.name.split(/\s+/).filter(word => /^[A-Za-z]/.test(word) && word.length > 2)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 3).map(word => word[0].toUpperCase()).join('')
}

function BodyPicture({ body }: { body: IndustryBody }) {
  if (body.image) {
    return (
      <div className="relative h-44 overflow-hidden border-b border-border bg-surface md:h-full md:border-b-0 md:border-r">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={body.image} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className="flex h-32 items-center justify-center border-b border-border bg-surface md:h-full md:border-b-0 md:border-r">
      <span aria-hidden className="font-serif text-[30px] font-semibold tracking-[-.03em] text-ink/25">{monogram(body)}</span>
    </div>
  )
}

function Voice({ label, text, accented }: { label: string; text: string; accented?: boolean }) {
  return (
    <div className={accented ? 'bg-surface p-5' : 'bg-white p-5'}>
      <p className={`text-[10px] font-semibold uppercase tracking-[.14em] ${accented ? 'text-accent' : 'text-muted'}`}>{label}</p>
      <p className="mt-2 text-[13px] leading-6 text-ink">{text}</p>
    </div>
  )
}

export default function GoodToKnowPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-white">
        <section className="mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-8 lg:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-accent">Good to know</p>
          <h1 className="site-heading mt-4 max-w-4xl text-[40px] leading-[1.05] tracking-[-.04em] md:text-[54px]">
            Who governs, insures and qualifies this industry.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-secondary">
            Nobody hands you this list when you qualify. These are the {TOTAL_BODIES} organisations that set the
            standards, arrange the insurance, award the certificates and report the news in UK spa and wellness.
            Each one gets three answers: what it does for your career, what it does for a spa, and what we make of it.
          </p>
          <p className="mt-5 max-w-2xl text-[13px] leading-7 text-muted">
            Talent House is not affiliated with any of them, and nothing here is a recommendation to join or to buy.
            Each entry is described from the organisation&apos;s own published material and links straight to it.
          </p>
        </section>

        <nav aria-label="Sections" className="border-y border-border bg-surface">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2 px-6 py-4 lg:px-8">
            {INDUSTRY_GROUPS.map(group => (
              <a key={group.id} href={`#${group.id}`} className="text-[12px] font-medium text-secondary hover:text-ink">
                {group.title}
              </a>
            ))}
          </div>
        </nav>

        {INDUSTRY_GROUPS.map(group => (
          <section key={group.id} id={group.id} className="scroll-mt-24 border-b border-border">
            <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
              <h2 className="site-heading text-[28px] leading-[1.15] tracking-[-.03em]">{group.title}</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-7 text-secondary">{group.intro}</p>

              <div className="mt-9 space-y-5">
                {group.bodies.map(body => (
                  <article key={body.name} className="border border-border bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                      <BodyPicture body={body} />

                      <div className="p-7">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-[19px] font-medium tracking-[-.02em] text-ink">{body.name}</h3>
                          {body.shortName ? <span className="text-[13px] text-muted">{body.shortName}</span> : null}
                        </div>

                        {body.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {body.tags.map(tag => (
                              <span key={tag} className="border border-border px-2.5 py-1 text-[10px] uppercase tracking-[.08em] text-secondary">{tag}</span>
                            ))}
                          </div>
                        )}

                        <p className="mt-5 text-[14px] leading-7 text-secondary">{body.what}</p>

                        {/* Three voices, one card. A therapist, an operator and
                            us, because the same organisation is worth a
                            different amount to each of them and a single
                            paragraph has to pick one to disappoint. */}
                        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
                          <Voice label="Why professionals need it" text={body.whyItMatters} />
                          <Voice label="Why Talent House rates it" text={body.whyWeRateIt} accented />
                          <Voice label="Why spas value it" text={body.whySpasValueIt} />
                        </div>

                        <a href={body.url} target="_blank" rel="noreferrer noopener"
                          className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline">
                          Visit {body.shortName || body.name} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-3xl">
              <ShieldCheck size={22} className="text-accent" />
              <h2 className="site-heading mt-4 text-[30px] leading-[1.1] tracking-[-.03em]">
                Your qualifications and insurance, verified once.
              </h2>
              <p className="mt-5 text-[14px] leading-8 text-secondary">
                Talent House verifies certificates, insurance and right to work on a professional&apos;s profile, so a
                property can see they hold what they say they hold without asking for the same documents again at every
                interview. Keeping insurance current with a body such as BABTAC is what makes that badge worth
                something.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link href="/register/talent" className="btn-primary inline-flex items-center gap-1.5 text-[13px]">
                  Create a professional profile <ArrowRight size={13} />
                </Link>
                <Link href="/academy" className="btn-secondary text-[13px]">See the Academy</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
