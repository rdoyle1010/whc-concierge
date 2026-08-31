import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import CandidateProfileMockup from '@/components/homepage-mockups/CandidateProfileMockup'
import MatchScoreMockup from '@/components/homepage-mockups/MatchScoreMockup'
import RoleListingMockup from '@/components/homepage-mockups/RoleListingMockup'
import Footer from '@/components/Footer'
import HeroCarousel from '@/components/HeroCarousel'
import HomepageHowItWorks from '@/components/HomepageHowItWorks'
import Navbar from '@/components/Navbar'
import TestimonialCarousel from '@/components/TestimonialCarousel'
import SponsoredAd from '@/components/SponsoredAd'
import FeaturedPropertiesSection from '@/components/FeaturedPropertiesSection'
import { getWebsiteContent } from '@/lib/site-content-server'
import { websiteCssVariables, type WebsiteContent, type WebsiteSectionId } from '@/lib/site-content'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: 'WHC Concierge | Spa and Wellness Careers' },
  description: 'The professional platform for spa and wellness careers. Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk' },
}

type FeaturedRole = {
  id: string
  title: string
  property: string
  location: string
  salary: string
  type: string
  tier: string
}

type FeaturedTalent = {
  id: string
  name: string
  headline: string
  location: string
  image: string | null
  experience: number | null
}

const getFeaturedTalent = unstable_cache(async (): Promise<FeaturedTalent[]> => {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data } = await admin.from('candidate_profiles')
      .select('id, full_name, headline, location, profile_image_url, experience_years')
      .eq('is_featured', true)
      .eq('approval_status', 'approved')
      .or('profile_visible.eq.true,profile_visible.is.null')
      .or('stealth_mode.eq.false,stealth_mode.is.null')
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .order('featured_until', { ascending: false })
      .limit(6)
    return (data || []).map((candidate: any) => ({
      id: candidate.id,
      name: candidate.full_name || 'Wellness professional',
      headline: candidate.headline || 'Luxury wellness professional',
      location: candidate.location || '',
      image: candidate.profile_image_url || null,
      experience: candidate.experience_years || null,
    }))
  } catch {
    return []
  }
}, ['homepage-featured-talent-v1'], { revalidate: 60 })

const getFeaturedRoles = unstable_cache(async (): Promise<FeaturedRole[]> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('job_listings')
      .select('id, job_title, location, salary_min, salary_max, contract_type, tier, employer_profiles(company_name, property_name)')
      .eq('is_live', true)
      .order('posted_date', { ascending: false })
      .limit(3)

    return (data || []).map((job: any) => ({
      id: job.id,
      title: job.job_title || 'Untitled role',
      property: job.employer_profiles?.property_name || job.employer_profiles?.company_name || '',
      location: job.location || '',
      salary: job.salary_min >= 1000 && job.salary_max >= 1000
        ? `£${Math.round(job.salary_min / 1000)}k–£${Math.round(job.salary_max / 1000)}k`
        : 'Competitive',
      type: job.contract_type?.replaceAll('_', ' ') || '',
      tier: job.tier || 'Standard',
    }))
  } catch {
    return []
  }
}, ['homepage-featured-roles-v1'], { revalidate: 60 })

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
  return <p className="site-accent mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">{children}</p>
}

function ProofSection({ content }: { content: WebsiteContent }) {
  return <section className="site-surface border-y border-black/10">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-6 py-7 text-center">
      {content.proof.items.map(item => <p key={item} className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-60">{item}</p>)}
    </div>
  </section>
}

function HowItWorksSection({ content }: { content: WebsiteContent }) {
  return <section className="site-section" style={{ background: 'var(--site-background)' }}>
    <div className="mx-auto grid max-w-7xl items-stretch gap-12 px-6 lg:grid-cols-12 lg:px-8">
      <div className="lg:col-span-5">
        <Eyebrow>{content.howItWorks.eyebrow}</Eyebrow>
        <h2 className="site-heading mb-10 text-[34px] font-medium leading-[1.05] md:text-[48px]">{content.howItWorks.heading}</h2>
        <HomepageHowItWorks />
      </div>
      <div className="relative hidden min-h-[520px] overflow-hidden sm:block lg:col-span-7">
        <Image
          src={content.howItWorks.image.url}
          alt={content.howItWorks.image.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          quality={70}
          className="object-cover"
          style={{ objectPosition: `${content.howItWorks.image.focalX}% ${content.howItWorks.image.focalY}%` }}
        />
      </div>
    </div>
  </section>
}

function ProductSection({ content }: { content: WebsiteContent }) {
  const mockups = [<CandidateProfileMockup key="candidate" />, <MatchScoreMockup key="matching" />, <RoleListingMockup key="role" />]
  const examples = [
    {
      label: 'Example professional profile',
      text: 'Employers can see the person behind the CV - experience, treatment skills, qualifications, location, availability and professional status in one place.',
    },
    {
      label: 'Why this match',
      text: 'We compare the things that genuinely affect fit: skills, treatments, qualifications, experience, location, availability and working preferences - not just keywords.',
    },
    {
      label: 'Example live opportunity',
      text: 'Professionals see real roles and shifts that suit their profile, so they can quickly understand the property, the work and why it may suit them.',
    },
  ]

  const wayLinks = [
    { href: '/jobs', action: 'Browse roles' },
    { href: '/agency/about', action: 'Explore agency' },
    { href: '/residency', action: 'Explore residencies' },
  ]
  const waysToWork = content.product.cards.map((card, index) => ({
    title: card.label,
    text: card.text,
    href: wayLinks[index]?.href ?? '/jobs',
    action: wayLinks[index]?.action ?? 'Learn more',
  }))

  return <section className="site-section site-surface">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <Eyebrow>{content.product.eyebrow}</Eyebrow>
        <h2 className="site-heading mb-5 text-[34px] font-medium leading-[1.05] md:text-[48px]">{content.product.heading}</h2>
        <p className="text-[15px] leading-[1.8] opacity-65 md:text-[17px]">{content.product.intro}</p>
      </div>

      <div className="mb-20 grid gap-4 md:grid-cols-3">
        {waysToWork.map(item => <Link key={item.title} href={item.href} className="group border border-black/10 bg-white p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <h3 className="site-heading mb-3 text-[22px] font-medium">{item.title}</h3>
          <p className="mb-6 text-[13px] leading-[1.7] opacity-65">{item.text}</p>
          <span className="site-accent inline-flex items-center gap-2 text-[12px] font-semibold">{item.action}<ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></span>
        </Link>)}
      </div>

      <div className="mx-auto mb-12 max-w-3xl text-center">
        <Eyebrow>See how it works</Eyebrow>
        <h2 className="site-heading mb-5 text-[32px] font-medium leading-[1.05] md:text-[42px]">From profile to genuine match.</h2>
        <p className="text-[15px] leading-[1.8] opacity-65">A simple view of what employers and professionals actually see - and how the platform helps both sides make a better decision.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {examples.map((card, index) => <div key={card.label} className="flex flex-col">
          <p className="site-accent mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.15em]">{card.label}</p>
          <div className="relative">
            <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#10283b] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">Sample - for illustration</span>
            {mockups[index]}
          </div>
          <p className="mx-auto mt-5 max-w-xs text-center text-[13px] leading-[1.75] opacity-65">{card.text}</p>
        </div>)}
      </div>

      <div className="mx-auto mt-16 max-w-5xl border border-black/10 bg-white px-6 py-8 text-center md:px-10">
        <p className="site-accent mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">Built for an international industry</p>
        <h3 className="site-heading mb-4 text-[24px] font-medium md:text-[30px]">Trained somewhere else? Your experience should still make sense here.</h3>
        <p className="mx-auto max-w-3xl text-[13px] leading-[1.8] opacity-65 md:text-[14px]">Spa is a global industry. Profiles can show where someone trained, the treatments they are qualified to perform, qualification review status, right-to-work information and insurance status - helping employers understand international experience without relying on an unfamiliar certificate name alone.</p>
      </div>
    </div>
  </section>
}

function TrustSection({ content }: { content: WebsiteContent }) {
  return <section className="border-y border-black/10 py-16" style={{ background: 'var(--site-background)' }}>
    <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
      <div className="site-accent-bg mx-auto mb-6 h-px w-14" />
      <p className="mb-9 text-[11px] uppercase tracking-[0.16em] opacity-55">{content.trust.eyebrow}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {content.trust.items.map(item => <span key={item} className="text-[14px] font-semibold tracking-[0.06em] opacity-70">{item}</span>)}
      </div>
    </div>
  </section>
}

function RolesSection({ content, roles }: { content: WebsiteContent; roles: FeaturedRole[] }) {
  if (!roles.length) return null
  return <section className="site-section" style={{ background: 'var(--site-background)' }}>
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div><Eyebrow>{content.roles.eyebrow}</Eyebrow><h2 className="site-heading text-[34px] font-medium md:text-[48px]">{content.roles.heading}</h2></div>
        <Link href="/jobs" className="hidden items-center gap-2 text-[13px] font-medium opacity-60 transition-opacity hover:opacity-100 md:flex">{content.roles.linkLabel}<ArrowRight size={14} /></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {roles.map((role, index) => {
          const image = content.roles.images[index % content.roles.images.length]
          return <Link key={role.id} href={`/jobs/${role.id}`} className="group overflow-hidden border border-black/10 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-44 overflow-hidden">
              <Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 33vw" quality={68} className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
            </div>
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between"><span className="site-accent text-[10px] font-semibold uppercase tracking-[0.12em]">{['Platinum','Gold'].includes(String(role.tier))?'Featured role':'Live role'}</span><span className="text-[11px] capitalize opacity-70">{role.type}</span></div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.12em] opacity-70">{role.property}</p>
              <h3 className="site-heading mb-4 text-[19px]">{role.title}</h3>
              <div className="flex items-center gap-3 text-[12px] opacity-60">{role.location && <span className="flex items-center gap-1"><MapPin size={12} />{role.location}</span>}<span>{role.salary}</span></div>
            </div>
          </Link>
        })}
      </div>
      <Link href="/jobs" className="site-button site-accent-bg mx-auto mt-8 flex w-fit items-center gap-2 px-6 py-3 text-[13px] font-semibold text-white md:hidden">{content.roles.linkLabel}<ArrowRight size={14} /></Link>
    </div>
  </section>
}

function FeaturedTalentSection({ talent }: { talent: FeaturedTalent[] }) {
  if (!talent.length) return null
  return <section className="border-b border-black/10 bg-white py-12">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><Eyebrow>Featured talent</Eyebrow><h2 className="site-heading text-[30px] font-medium md:text-[40px]">Professionals ready to be discovered.</h2></div>
        <Link href="/employer/candidates" className="site-button site-accent-bg w-fit px-5 py-3 text-[12px] font-semibold text-white">Employers: view all talent</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {talent.map(candidate => <Link key={candidate.id} href={`/employer/candidates?candidate=${encodeURIComponent(candidate.id)}`} aria-label={`View featured profile for ${candidate.name}`} className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#eef2f4]">
            {candidate.image ? <Image src={candidate.image} alt={candidate.name} width={64} height={64} sizes="64px" quality={65} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-semibold opacity-40">{candidate.name[0]}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="site-accent mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em]"><Star size={11} fill="currentColor" /> Featured</p>
            <h3 className="truncate text-[16px] font-semibold">{candidate.name}</h3>
            <p className="truncate text-[12px] opacity-65">{candidate.headline}</p>
            <p className="mt-1 text-[11px] opacity-50">{[candidate.location, candidate.experience ? `${candidate.experience} years experience` : ''].filter(Boolean).join(' · ')}</p>
            <span className="site-accent mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">View profile <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" /></span>
          </div>
        </Link>)}
      </div>
    </div>
  </section>
}

function CalloutSection({ content }: { content: WebsiteContent }) {
  return <section className="relative overflow-hidden">
    <Image
      src={content.cta.background.url}
      alt={content.cta.background.alt}
      fill
      sizes="100vw"
      quality={68}
      className="object-cover"
      style={{ objectPosition: `${content.cta.background.focalX}% ${content.cta.background.focalY}%` }}
    />
    <div className="absolute inset-0 bg-black/45" />
    <div className="relative z-10 mx-auto grid max-w-6xl gap-px px-6 py-24 md:grid-cols-2 lg:px-8">
      {([content.cta.talent, content.cta.employer] as const).map(card => <div key={card.eyebrow} className="bg-white p-8 md:p-12">
        <Eyebrow>{card.eyebrow}</Eyebrow>
        <h2 className="site-heading mb-5 text-[28px] font-medium leading-[1.08] md:text-[34px]">{card.heading}</h2>
        <p className="mb-8 text-[14px] leading-[1.75] opacity-65">{card.text}</p>
        <Link href={card.buttonHref} className="site-button site-accent-bg inline-block px-6 py-3 text-[13px] font-semibold text-white">{card.buttonLabel}</Link>
      </div>)}
    </div>
  </section>
}

function ServicesSection({ content }: { content: WebsiteContent }) {
  return <section className="site-section site-surface">
    <div className="mx-auto grid max-w-7xl gap-px px-6 md:grid-cols-3 lg:px-8">
      {content.services.cards.map(card => <article key={card.eyebrow} className="flex flex-col bg-white p-8 md:p-10">
        <Eyebrow>{card.eyebrow}</Eyebrow>
        <h2 className="site-heading mb-4 text-[26px] leading-[1.08]">{card.heading}</h2>
        <p className="mb-8 flex-1 text-[14px] leading-[1.75] opacity-65">{card.text}</p>
        <Link href={card.buttonHref} className="site-button site-accent-bg w-fit px-5 py-3 text-[12px] font-semibold text-white">{card.buttonLabel}</Link>
      </article>)}
    </div>
  </section>
}

function TestimonialsSection({ content }: { content: WebsiteContent }) {
  return <section className="site-section" style={{ background: 'var(--site-background)' }}>
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-12 text-center"><Eyebrow>{content.testimonials.eyebrow}</Eyebrow><h2 className="site-heading text-[34px] font-medium md:text-[48px]">{content.testimonials.heading}</h2><span className="mt-4 inline-block bg-[#10283b] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Illustrative</span></div>
      <TestimonialCarousel />
      <div className="mt-9 text-center"><Link href="/testimonials" className="text-[13px] underline underline-offset-4 opacity-60 hover:opacity-100">{content.testimonials.linkLabel}</Link></div>
    </div>
  </section>
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">WHC Concierge</p>
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

type HomePageProps = { searchParams?: Promise<{ websitePreview?: string | string[] }> }

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams
  const previewRequested = searchParams?.websitePreview === 'draft'
  const previewingDraft = previewRequested && (await canPreviewDraft())
  const [content, featuredRoles, featuredTalent] = await Promise.all([getWebsiteContent(previewingDraft), getFeaturedRoles(), getFeaturedTalent()])

  const sections: Record<WebsiteSectionId, ReactNode> = {
    proof: <ProofSection content={content} />,
    howItWorks: <HowItWorksSection content={content} />,
    product: <ProductSection content={content} />,
    trust: <TrustSection content={content} />,
    roles: <RolesSection content={content} roles={featuredRoles} />,
    cta: <CalloutSection content={content} />,
    services: <ServicesSection content={content} />,
    testimonials: <TestimonialsSection content={content} />,
  }

  return <div className="website-theme min-h-screen" style={websiteCssVariables(content)}>
    <Navbar siteContent={content} />
    <main className="pt-[76px]">
      {previewingDraft && <div className="site-accent-bg px-5 py-2 text-center text-[12px] font-semibold text-white">Private draft preview - the public website has not changed.</div>}
      <HeroCarousel siteContent={content} />
      <RoutesSection />
      <SponsoredAd placement="homepage_spotlight" />
      <FeaturedTalentSection talent={featuredTalent} />
      <FeaturedPropertiesSection />
      {content.sections.filter(section => section.visible).map(section => <div key={section.id}>{sections[section.id]}</div>)}
    </main>
    <Footer siteContent={content} />
  </div>
}
