import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, BadgeCheck, Clock } from 'lucide-react'
import { CAREER_LADDER, courseMeta } from '@/lib/academy-meta'
import { getAcademySummaries } from '@/lib/academy-catalog-server'
import { publicCoursePrice } from '@/lib/academy-pricing'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'

// The ladder, published.
//
// Seven rungs from "Starting out" to "Spa Director", each with the courses that
// move somebody up one, have been in academy-meta.ts for months - behind
// /talent/career, which robots.txt blocks. So the one page on this platform
// that answers "how do I become a spa manager" was visible only to people who
// had already signed up, which is to say the people who least needed it.
//
// It is also the natural front door to the Academy: somebody reading about the
// step they are trying to take is exactly the person who buys the course that
// takes it.
export const revalidate = 3600

const TITLE = 'Spa Career Path: Therapist to Spa Director | Talent House'
const DESCRIPTION = 'The route from spa therapist to spa director, rung by rung, and the training that moves you up each one.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/career` },
  openGraph: { ...OG_DEFAULTS, title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/career` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default async function CareerPathPage() {
  const courses = await getAcademySummaries().catch(() => [])
  const bySlug = new Map(courses.map(course => [course.slug, course]))

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CAREER_LADDER.map(rung => ({
      '@type': 'Question',
      name: `How do you go from ${rung.label.toLowerCase()} to ${rung.nextLabel.toLowerCase()} in a spa?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `The step from ${rung.label} to ${rung.nextLabel} is proved rather than claimed. `
          + `The training that evidences it: ${rung.recommendedSlugs.map(slug => bySlug.get(slug)?.title || slug).join(', ')}.`,
      },
    })),
  }

  return (
    <div className="public-page">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main id="main-content" className="pt-[76px]">
        <section className="border-b border-border bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
            <p className="public-eyebrow mb-4">The spa career path</p>
            <h1 className="public-title mb-5">Therapist to director, one rung at a time.</h1>
            <p className="max-w-2xl text-[15px] leading-7 text-secondary">
              Nobody publishes this. Spa careers move in steps that are obvious once somebody names them, and
              invisible while nobody does. Here is the ladder as luxury properties actually hire it, and the
              training that evidences each step rather than merely claiming it.
            </p>
            <p className="mt-5 max-w-2xl text-[13px] leading-6 text-muted">
              Free to read, no account needed. A free Talent House profile adds where you sit on it today and what
              the roles you want are asking for.
            </p>
          </div>
        </section>

        <section className="bg-surface">
          <div className="mx-auto max-w-4xl px-6 py-14 md:py-16">
            <ol className="space-y-5">
              {CAREER_LADDER.map(rung => (
                <li key={rung.level} className="border border-border bg-white p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Level {rung.level}</p>
                      <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.03em] text-ink">{rung.label}</h2>
                    </div>
                    <p className="text-[13px] text-secondary">
                      Next: <span className="font-semibold text-ink">{rung.nextLabel}</span>
                    </p>
                  </div>

                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
                    What moves you up
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {rung.recommendedSlugs.map(slug => {
                      const course = bySlug.get(slug)
                      if (!course) return null
                      const meta = courseMeta(course.slug, course.title)
                      return (
                        <Link
                          key={slug}
                          href={`/academy/${slug}`}
                          className="group border border-border bg-surface p-4 transition-colors hover:border-accent"
                        >
                          <p className="text-[14px] font-semibold leading-snug text-ink group-hover:text-accent">{course.title}</p>
                          <p className="mt-1.5 text-[12px] leading-6 text-secondary">{course.tagline}</p>
                          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                            <span className="inline-flex items-center gap-1"><Clock size={11} /> ~{course.minutes} min</span>
                            <span className="inline-flex items-center gap-1"><BadgeCheck size={11} /> {meta.cpdHours} CPD hour{meta.cpdHours === 1 ? '' : 's'}</span>
                            <span>£{(publicCoursePrice(course) / 100).toFixed(0)}</span>
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-4xl px-6 py-14 md:py-16">
            <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">Where do you sit on it?</h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-secondary">
              A free profile places you on this ladder from your own experience, shows what the roles you want are
              asking for, and keeps your certificates in one place where an employer can check them.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register/talent" className="btn-primary inline-flex items-center gap-2">Create a free profile <ArrowRight size={14} /></Link>
              <Link href="/academy" className="btn-secondary">See all courses</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
