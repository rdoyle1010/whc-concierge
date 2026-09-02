import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import PanelBackdrop from '@/components/PanelBackdrop'
import { unstable_cache } from 'next/cache'
import { BadgeCheck, Star } from 'lucide-react'
import Footer from '@/components/Footer'
import HeroCarousel from '@/components/HeroCarousel'
import Navbar from '@/components/Navbar'
import SponsoredAd from '@/components/SponsoredAd'
import { getWebsiteContent } from '@/lib/site-content-server'
import { websiteCssVariables, type WebsiteContent, type WebsiteSectionId } from '@/lib/site-content'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: 'Talent House Collective | Spa and Wellness Careers' },
  description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
  alternates: { canonical: 'https://talenthousecollective.co.uk' },
}

type FeaturedRole = {
  id: string
  title: string
  property: string
  location: string
  salary: string | null
  starRating: string | null
}

type LiveNumbers = {
  roles: number
  properties: number
  reviews: number
  certificates: number
}

type VerifiedReview = {
  id: string
  rating: number
  comment: string
  createdAt: string | null
  source: string
  reviewerName: string
  reviewerRole: string | null
}

function roleSalary(job: any): string | null {
  if (job.salary_display_text) return String(job.salary_display_text)
  if (job.salary_min && job.salary_max) return `£${Number(job.salary_min).toLocaleString('en-GB')} - £${Number(job.salary_max).toLocaleString('en-GB')}`
  if (job.salary_min) return `From £${Number(job.salary_min).toLocaleString('en-GB')}`
  return null
}

const getFeaturedRoles = unstable_cache(async (): Promise<FeaturedRole[]> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('job_listings')
      .select('id, job_title, location, salary_display_text, salary_min, salary_max, employer_profiles(company_name, property_name, star_rating)')
      .eq('is_live', true)
      .eq('status', 'active')
      .order('posted_date', { ascending: false })
      .limit(3)

    return (data || []).map((job: any) => {
      const rawStar = job.employer_profiles?.star_rating
      const starRating = rawStar
        ? (isNaN(Number(rawStar)) ? String(rawStar) : `${rawStar} star`)
        : null
      return {
        id: job.id,
        title: job.job_title || 'Untitled role',
        property: job.employer_profiles?.property_name || job.employer_profiles?.company_name || '',
        location: job.location || '',
        salary: roleSalary(job),
        starRating,
      }
    })
  } catch {
    return []
  }
}, ['homepage-featured-roles-v2'], { revalidate: 60 })

// The homepage's proof is the live state of the platform, not a claim. Each
// count is real; a figure only appears once it is greater than zero.
const getLiveNumbers = unstable_cache(async (): Promise<LiveNumbers> => {
  const empty: LiveNumbers = { roles: 0, properties: 0, reviews: 0, certificates: 0 }
  try {
    const admin = createAdminClient()
    const [roles, properties, reviews, certificates] = await Promise.all([
      admin.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true).eq('status', 'active'),
      admin.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      admin.from('reviews').select('id', { count: 'exact', head: true }).gte('rating', 1).lte('rating', 5),
      admin.from('course_enrollments').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),
    ])
    return {
      roles: roles.count || 0,
      properties: properties.count || 0,
      reviews: reviews.count || 0,
      certificates: certificates.count || 0,
    }
  } catch {
    return empty
  }
}, ['homepage-live-numbers-v1'], { revalidate: 300 })

// Real reviews only - written by professionals after verified placements and
// completed shifts. When none exist yet, the section renders nothing.
const getVerifiedReviews = unstable_cache(async (): Promise<VerifiedReview[]> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('reviews')
      .select('id, reviewer_id, rating, text, booking_id, created_at')
      .gte('rating', 1)
      .lte('rating', 5)
      .not('text', 'is', null)
      .neq('text', '')
      .order('created_at', { ascending: false })
      .limit(12)

    const rows = (data || []).filter((row: any) => String(row.text || '').trim()).slice(0, 3)
    const reviewerIds = [...new Set(rows.map((row: any) => row.reviewer_id).filter(Boolean))]
    const { data: candidates } = reviewerIds.length
      ? await admin.from('candidate_profiles').select('user_id, role_level').in('user_id', reviewerIds)
      : { data: [] as any[] }
    const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.user_id, candidate]))

    return rows.map((row: any) => {
      const reviewer: any = candidateMap.get(row.reviewer_id)
      return {
        id: row.id,
        rating: Number(row.rating),
        comment: String(row.text).trim(),
        createdAt: row.created_at || null,
        source: row.booking_id ? 'Completed WHC agency shift' : 'WHC placement',
        // Published by role, never by name. Nobody consented to having their
        // legal name attached, on the open web, to a public opinion of a
        // named former employer.
        reviewerName: reviewer?.role_level || 'Verified WHC professional',
        reviewerRole: null,
      }
    })
  } catch {
    return []
  }
}, ['homepage-verified-reviews-v1'], { revalidate: 300 })

async function canPreviewDraft() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const admin = createAdminClient()
    const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    return data?.role === 'admin'
  } catch {
    return false
  }
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{children}</p>
}

// A quiet ruled strip of what is actually live on the platform right now.
// Figures come straight from the database and only render when above zero.
function NumbersStrip({ numbers }: { numbers: LiveNumbers }) {
  const items = [
    numbers.roles > 0 ? { label: numbers.roles === 1 ? 'Live role' : 'Live roles', value: numbers.roles } : null,
    numbers.properties > 0 ? { label: numbers.properties === 1 ? 'Approved property' : 'Approved properties', value: numbers.properties } : null,
    numbers.reviews > 0 ? { label: numbers.reviews === 1 ? 'Verified staff review' : 'Verified staff reviews', value: numbers.reviews } : null,
    numbers.certificates > 0 ? { label: numbers.certificates === 1 ? 'Academy certificate issued' : 'Academy certificates issued', value: numbers.certificates } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>
  if (!items.length) return null

  return (
    <section aria-label="Live on WHC today" className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Eyebrow>Live on WHC today</Eyebrow>
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {items.map(item => (
            <div key={item.label} className="border-t border-border pt-3">
              <p className="text-[28px] font-serif font-semibold leading-none text-ink">{item.value.toLocaleString('en-GB')}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[.14em] text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// The first ten seconds, made structural: what this is, who it is for and
// where to go next - in plain language, before any product name appears.
function RoutesSection() {
  const routes = [
    {
      title: "I'm hiring",
      copy: 'Post roles to matched, vetted professionals, book flexible cover by the hour, or have WHC run the whole search.',
      href: '/register?role=employer',
      cta: 'Find exceptional people',
    },
    {
      title: "I'm looking for my next move",
      copy: 'Browse live roles at exceptional properties, match on your real skills, and keep your salary private until you choose.',
      href: '/jobs',
      cta: 'See live roles',
    },
    {
      title: "I'm developing my career",
      copy: 'Professional courses with verified certificates, CPD hours, and intelligence on what the market is asking for next.',
      href: '/academy',
      cta: 'Explore the Academy',
    },
  ]
  return (
    <section className="border-b border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Talent House Collective</p>
        <h2 className="site-heading mt-2 max-w-3xl text-[26px] font-semibold leading-tight md:text-[32px]">The professional platform for spa and wellness careers.</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-secondary">Find exceptional people. Build better careers. Develop stronger spa businesses.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {routes.map(route => (
            <Link key={route.title} href={route.href} className="group flex flex-col border border-border bg-white p-6 transition-colors hover:border-accent">
              <h3 className="text-[18px] font-semibold text-ink">{route.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-6 text-secondary">{route.copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-accent">{route.cta} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Live roles as quiet ruled rows - the property page's vacancy treatment,
// not picture cards. Heading and link label stay admin-editable.
function RolesSection({ content, roles }: { content: WebsiteContent; roles: FeaturedRole[] }) {
  if (!roles.length) return null
  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Eyebrow>{content.roles.eyebrow}</Eyebrow>
        <h2 className="site-heading mt-2 text-[26px] font-semibold leading-tight md:text-[32px]">{content.roles.heading}</h2>
        <div className="mt-8 border-b border-border">
          {roles.map(role => (
            <Link key={role.id} href={`/jobs/${role.id}`} className="group flex items-baseline justify-between gap-6 border-t border-border py-6">
              <div>
                <h3 className="site-heading text-[20px] transition-colors group-hover:text-accent md:text-[23px]">{role.title}</h3>
                <p className="mt-1.5 text-[13px] text-secondary">
                  {[role.property, role.location, role.salary, role.starRating].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="hidden whitespace-nowrap text-[13px] font-semibold text-accent sm:inline">View role &rarr;</span>
            </Link>
          ))}
        </div>
        <Link href="/jobs" className="mt-6 inline-block text-[13px] font-semibold text-accent hover:underline">{content.roles.linkLabel}</Link>
      </div>
    </section>
  )
}

// Featured placements are sold inventory - properties and professionals
// who have paid (or been granted) featured status keep a homepage presence,
// clearly labelled, in the quiet ruled idiom. Renders nothing when nothing
// is featured.
type FeaturedEntry = { id: string; title: string; meta: string; href: string }
const getFeaturedPlacements = unstable_cache(async (): Promise<{ properties: FeaturedEntry[]; professionals: FeaturedEntry[] }> => {
  // The queries below are guarded, but the client that runs them was not:
  // createAdminClient throws when its configuration is missing, and it sat
  // outside the try. Featured placements are sold inventory on the homepage -
  // the busiest page on the site - and a database wobble took the whole page
  // down to an error screen rather than quietly dropping a panel.
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { properties: [], professionals: [] }
  }
  try {
    const [{ data: employers }, { data: candidates }] = await Promise.all([
      admin.from('employer_profiles')
        .select('id, property_name, company_name, location, city, star_rating')
        .eq('approval_status', 'approved').eq('featured_employer', true).limit(3),
      admin.from('candidate_profiles')
        .select('id, full_name, role_level, location, is_featured, featured_until, show_first_name_only, approval_status, profile_visible')
        .eq('approval_status', 'approved').eq('is_featured', true).limit(6),
    ])
    const properties = (employers || []).map((e: any) => ({
      id: e.id,
      title: e.property_name || e.company_name || 'Property',
      meta: [e.city || e.location, e.star_rating ? `${e.star_rating} star` : null].filter(Boolean).join(' · '),
      href: `/properties/${e.id}`,
    }))
    const professionals = (candidates || [])
      .filter((c: any) => c.profile_visible !== false && (!c.featured_until || new Date(c.featured_until).getTime() >= Date.now()))
      .slice(0, 3)
      .map((c: any) => {
        const parts = String(c.full_name || '').trim().split(/\s+/)
        const name = c.show_first_name_only && parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : (c.full_name || 'Professional')
        return {
          id: c.id,
          title: name,
          meta: [c.role_level, c.location].filter(Boolean).join(' · '),
          href: `/employer/candidates?candidate=${c.id}`,
        }
      })
    return { properties, professionals }
  } catch { return { properties: [], professionals: [] } }
}, ['homepage-featured-placements-v1'], { revalidate: 300 })

function FeaturedPlacementsSection({ placements }: { placements: { properties: FeaturedEntry[]; professionals: FeaturedEntry[] } }) {
  if (!placements.properties.length && !placements.professionals.length) return null
  return (
    <section className="border-b border-border bg-[#f1f1f1]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Eyebrow>Featured on WHC</Eyebrow>
        <div className="mt-6 grid gap-x-14 gap-y-8 md:grid-cols-2">
          {placements.properties.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Properties</p>
              <div className="mt-2 border-b border-border">
                {placements.properties.map(entry => (
                  <Link key={entry.id} href={entry.href} className="group flex items-baseline justify-between gap-6 border-t border-border py-4">
                    <div>
                      <p className="site-heading text-[17px] transition-colors group-hover:text-accent">{entry.title}</p>
                      {entry.meta && <p className="mt-0.5 text-[12px] text-secondary">{entry.meta}</p>}
                    </div>
                    <span className="hidden whitespace-nowrap text-[12px] font-semibold text-accent sm:inline">Explore &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {placements.professionals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Professionals</p>
              <div className="mt-2 border-b border-border">
                {placements.professionals.map(entry => (
                  <Link key={entry.id} href={entry.href} className="group flex items-baseline justify-between gap-6 border-t border-border py-4">
                    <div>
                      <p className="site-heading text-[17px] transition-colors group-hover:text-accent">{entry.title}</p>
                      {entry.meta && <p className="mt-0.5 text-[12px] text-secondary">{entry.meta}</p>}
                    </div>
                    <span className="hidden whitespace-nowrap text-[12px] font-semibold text-accent sm:inline">View profile &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="mt-5 text-[11px] text-muted">Featured placements are paid positions, clearly labelled. Featuring never changes matching.</p>
      </div>
    </section>
  )
}

// Real reviews in the property page's review-card treatment. No invented
// quotes: when nothing verified exists yet, nothing renders.
function VerifiedReviewsSection({ content, reviews }: { content: WebsiteContent; reviews: VerifiedReview[] }) {
  if (!reviews.length) return null
  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Eyebrow>Verified on WHC</Eyebrow>
        <h2 className="site-heading mt-2 text-[26px] font-semibold leading-tight md:text-[32px]">{content.testimonials.heading}</h2>
        <p className="mt-4 max-w-2xl text-[12px] italic leading-6 text-muted">Reviews on WHC come only from verified placements and completed shifts.</p>
        <div className="mt-10 grid gap-x-14 gap-y-12 md:grid-cols-3">
          {reviews.map(review => (
            <article key={review.id} className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} className={n <= review.rating ? 'text-accent' : 'text-border'} fill={n <= review.rating ? 'currentColor' : 'none'} />)}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-accent"><BadgeCheck size={12} />Verified</span>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-body">&ldquo;{review.comment}&rdquo;</p>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-[13px] font-semibold text-ink">{review.reviewerName}{review.reviewerRole ? <span className="font-normal text-secondary"> · {review.reviewerRole}</span> : null}</p>
                <p className="text-[11px] text-muted">{review.source}{review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// One closing charcoal band, two audiences, one button each. Copy stays
// admin-editable through the Website editor's CTA fields.
function CalloutSection({ content }: { content: WebsiteContent }) {
  const panel = content.panels.homepageCta
  // The CTA background has always been an editable field; it now actually
  // reaches the page, and the same panel can be sold to a sponsor instead.
  const backdrop = { ...panel, image: panel.image.url ? panel.image : content.cta.background }
  return (
    <section className="site-accent-bg relative isolate overflow-hidden">
      <PanelBackdrop panel={backdrop} placement="homepage_cta_band" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20 lg:px-8">
        <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          {([content.cta.talent, content.cta.employer] as const).map(card => (
            <div key={card.eyebrow} className="border-t border-white/20 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{card.eyebrow}</p>
              <h2 className="site-heading mt-3 !text-white text-[26px] leading-[1.1] md:text-[32px]">{card.heading}</h2>
              <p className="mt-3 max-w-md text-[14px] leading-7 text-white/70">{card.text}</p>
              <Link href={card.buttonHref} className="site-button site-accent mt-7 inline-block bg-white px-6 py-3 text-[13px] font-semibold">{card.buttonLabel}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

type HomePageProps = { searchParams?: Promise<{ websitePreview?: string | string[] }> }

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams
  const previewRequested = searchParams?.websitePreview === 'draft'
  const previewingDraft = previewRequested && (await canPreviewDraft())
  const [content, featuredRoles, liveNumbers, verifiedReviews, featuredPlacements] = await Promise.all([
    getWebsiteContent(previewingDraft),
    getFeaturedRoles(),
    getLiveNumbers(),
    getVerifiedReviews(),
    getFeaturedPlacements(),
  ])

  // Admin section toggles keep working: each id the Website editor controls
  // still maps here. Sections retired in the homepage consolidation render
  // nothing; the surviving ones draw their copy from the same CMS fields.
  const sections: Record<WebsiteSectionId, ReactNode> = {
    proof: null,
    howItWorks: null,
    product: null,
    trust: null,
    roles: <RolesSection content={content} roles={featuredRoles} />,
    cta: <CalloutSection content={content} />,
    services: null,
    testimonials: <VerifiedReviewsSection content={content} reviews={verifiedReviews} />,
  }

  return <div className="website-theme min-h-screen" style={websiteCssVariables(content)}>
    <Navbar siteContent={content} />
    <main id="main-content" className="pt-[76px]">
      {previewingDraft && <div className="site-accent-bg px-5 py-2 text-center text-[12px] font-semibold text-white">Private draft preview - the public website has not changed.</div>}
      <HeroCarousel siteContent={content} />
      <NumbersStrip numbers={liveNumbers} />
      <RoutesSection />
      <SponsoredAd placement="homepage_spotlight" />
      {content.sections.filter(section => section.visible).map(section => <div key={section.id}>{sections[section.id]}</div>)}
      <FeaturedPlacementsSection placements={featuredPlacements} />
    </main>
    <Footer siteContent={content} />
  </div>
}
