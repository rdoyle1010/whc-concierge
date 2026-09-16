import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BadgeCheck, Clock, GraduationCap, CheckCircle2, ArrowLeft } from 'lucide-react'
import { getAcademySlugs, getCourseSyllabus } from '@/lib/academy-catalog-server'
import { courseMeta } from '@/lib/academy-meta'
import { publicCoursePrice } from '@/lib/academy-pricing'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'
import CourseBuyButton from './CourseBuyButton'

// A page per course, which the Academy has never had.
//
// Forty-eight courses lived at /talent/academy/[slug], which robots.txt blocks,
// and the card on /academy was a button rather than a link - so the entire
// Academy was one URL to a search engine, and the thing it sells was invisible.
//
// This matters more than it looks. A course is one of only two things on this
// platform that sells to a stranger with no marketplace behind it: fifteen
// pounds, no account, guest checkout. And the terms are unusually soft, because
// almost nobody in the UK has written this material: "LQA training", "Forbes
// five star spa standards", "CPD courses for spa therapists".
//
// The syllabus is public and the teaching is not. Lesson titles tell somebody
// what they are buying; lesson bodies are the thing they are buying.
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    return (await getAcademySlugs()).map(slug => ({ slug }))
  } catch {
    // No database at build time: the pages render on first request instead.
    return []
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const course = await getCourseSyllabus(slug).catch(() => null)
  if (!course) return { title: 'Course not found' }

  const meta = courseMeta(course.slug, course.title)
  const description = `${course.tagline} ${course.lesson_count} modules, about ${course.minutes} minutes, ${meta.cpdHours} CPD hour${meta.cpdHours === 1 ? '' : 's'} and a certificate.`.trim()

  return {
    title: `${course.title} | Talent House Academy`,
    description: description.length > 155 ? `${description.slice(0, 152).replace(/\s\S*$/, '')}...` : description,
    alternates: { canonical: `${SITE_URL}/academy/${course.slug}` },
    openGraph: { ...OG_DEFAULTS, title: `${course.title} | Talent House Academy`, description, url: `${SITE_URL}/academy/${course.slug}` },
    twitter: { card: 'summary_large_image', title: `${course.title} | Talent House Academy`, description },
  }
}

export default async function PublicCoursePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const course = await getCourseSyllabus(slug).catch(() => null)
  if (!course) notFound()

  const meta = courseMeta(course.slug, course.title)
  const price = publicCoursePrice(course)

  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.tagline,
    url: `${SITE_URL}/academy/${course.slug}`,
    provider: { '@type': 'Organization', name: 'Talent House Collective', url: SITE_URL },
    educationalCredentialAwarded: 'CPD certificate',
    teaches: meta.skills,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      // ISO 8601. Google reads the workload, and CPD hours are the number the
      // industry actually recognises.
      courseWorkload: `PT${meta.cpdHours}H`,
    },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      priceCurrency: 'GBP',
      price: (price / 100).toFixed(2),
      url: `${SITE_URL}/academy/${course.slug}`,
      availability: 'https://schema.org/InStock',
    },
  }

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Academy', item: `${SITE_URL}/academy` },
      { '@type': 'ListItem', position: 2, name: course.title, item: `${SITE_URL}/academy/${course.slug}` },
    ],
  }

  return (
    <div className="public-page">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

      <main id="main-content" className="pt-[76px]">
        <section className="border-b border-border bg-white">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <Link href="/academy" className="inline-flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
              <ArrowLeft size={13} /> All courses
            </Link>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 md:py-16 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="public-eyebrow mb-3">{course.category}</p>
              <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink md:text-[46px]">{course.title}</h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-secondary">{course.tagline}</p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-secondary">
                <span className="inline-flex items-center gap-1.5"><GraduationCap size={14} className="text-accent" /> {meta.level}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-accent" /> about {course.minutes} minutes</span>
                <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} className="text-accent" /> {meta.cpdHours} CPD hour{meta.cpdHours === 1 ? '' : 's'}</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> {course.lesson_count} module{course.lesson_count === 1 ? '' : 's'}</span>
              </div>

              <div className="mt-8">
                <CourseBuyButton slug={course.slug} title={course.title} price={price} />
              </div>
              <p className="mt-4 text-[12px] text-muted">
                Members pay less. Completing a course adds a verifiable badge to your Talent House profile, with a certificate code anybody can check.
              </p>
            </div>

            <aside className="h-fit border border-border bg-surface p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">What it is worth</p>
              <p className="mt-2 text-[30px] font-semibold text-ink">£{(price / 100).toFixed(0)}</p>
              <p className="mt-1 text-[12px] text-muted">One payment. Yours to keep.</p>
              {meta.skills.length > 0 && (
                <>
                  <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Skills it proves</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meta.skills.map(skill => (
                      <span key={skill} className="border border-accent/25 bg-[#ede8df] px-2.5 py-1 text-[11px] font-medium text-accent">{skill}</span>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] leading-6 text-secondary">
                    These are the same skill names properties search on, so the badge reads as evidence rather than decoration.
                  </p>
                </>
              )}
            </aside>
          </div>
        </section>

        {course.lesson_titles.length > 0 && (
          <section className="border-t border-border bg-surface">
            <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
              <p className="public-eyebrow mb-3">The syllabus</p>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink md:text-[34px]">What the {course.lesson_count} module{course.lesson_count === 1 ? '' : 's'} cover.</h2>
              <ol className="mt-8 border-t border-border">
                {course.lesson_titles.map((title, index) => (
                  <li key={`${title}-${index}`} className="flex gap-5 border-b border-border py-5">
                    <span className="w-8 shrink-0 font-serif text-[18px] text-muted tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-[15px] leading-7 text-ink">{title}</span>
                  </li>
                ))}
              </ol>
              {course.quiz_count > 0 && (
                <p className="mt-7 text-[13px] leading-7 text-secondary">
                  Finishes with a {course.quiz_count}-question assessment. Pass it and the certificate is issued with a code an employer can verify.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
            <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">Ready when you are.</h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-secondary">
              Work through it around your shifts. Nothing expires, and the certificate stays on your profile.
            </p>
            <div className="mt-7">
              <CourseBuyButton slug={course.slug} title={course.title} price={price} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

// A course published after the last build renders on first request and is then
// cached like the rest. `tags` is not a route segment option: the invalidation
// rides on the tagged read inside getCourseSyllabus.
export const dynamicParams = true
