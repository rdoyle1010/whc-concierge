import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import CandidateProfileMockup from '@/components/homepage-mockups/CandidateProfileMockup'
import MatchScoreMockup from '@/components/homepage-mockups/MatchScoreMockup'
import RoleListingMockup from '@/components/homepage-mockups/RoleListingMockup'
import Footer from '@/components/Footer'
import HeroCarousel from '@/components/HeroCarousel'
import HomepageHowItWorks from '@/components/HomepageHowItWorks'
import Navbar from '@/components/Navbar'
import TestimonialCarousel from '@/components/TestimonialCarousel'
import SponsoredAd from '@/components/SponsoredAd'
import { getWebsiteContent } from '@/lib/site-content-server'
import { websiteCssVariables, type WebsiteContent, type WebsiteSectionId } from '@/lib/site-content'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: 'WHC Concierge | Luxury Wellness Careers Platform' },
  description: 'The UK\'s specialist recruitment platform for luxury spa, wellness and hospitality — connecting exceptional professionals with five-star properties.',
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

async function getFeaturedRoles(): Promise<FeaturedRole[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
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
}

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
      <div className="hidden overflow-hidden sm:block lg:col-span-7">
        <img src={content.howItWorks.image.url} alt={content.howItWorks.image.alt} className="h-full max-h-[650px] w-full object-cover"
          style={{ objectPosition: `${content.howItWorks.image.focalX}% ${content.howItWorks.image.focalY}%` }} />
      </div>
    </div>
  </section>
}

function ProductSection({ content }: { content: WebsiteContent }) {
  const mockups = [<CandidateProfileMockup key="candidate" />, <MatchScoreMockup key="matching" />, <RoleListingMockup key="role" />]
  return <section className="site-section site-surface">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <Eyebrow>{content.product.eyebrow}</Eyebrow>
        <h2 className="site-heading mb-5 text-[34px] font-medium leading-[1.05] md:text-[48px]">{content.product.heading}</h2>
        <p className="text-[15px] leading-[1.8] opacity-65 md:text-[17px]">{content.product.intro}</p>
      </div>
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {content.product.cards.map((card, index) => <div key={card.label} className="flex flex-col">
          <p className="site-accent mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.15em]">{card.label}</p>
          {mockups[index]}
          <p className="mx-auto mt-5 max-w-xs text-center text-[13px] leading-[1.75] opacity-65">{card.text}</p>
        </div>)}
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
        {content.trust.items.map(item => <span key={item} className="text-[14px] font-semibold tracking-[0.06em] opacity-50">{item}</span>)}
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
        <Link href="/roles" className="hidden items-center gap-2 text-[13px] font-medium opacity-60 transition-opacity hover:opacity-100 md:flex">{content.roles.linkLabel}<ArrowRight size={14} /></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {roles.map((role, index) => {
          const image = content.roles.images[index % content.roles.images.length]
          return <Link key={role.id} href={`/jobs/${role.id}`} className="group overflow-hidden border border-black/10 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-44 overflow-hidden">
              <Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
            </div>
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between"><span className="site-accent text-[10px] font-semibold uppercase tracking-[0.12em]">{role.tier}</span><span className="text-[11px] capitalize opacity-50">{role.type}</span></div>
              <p className="mb-1 text-[10px] uppercase tracking-[0.12em] opacity-50">{role.property}</p>
              <h3 className="site-heading mb-4 text-[19px]">{role.title}</h3>
              <div className="flex items-center gap-3 text-[12px] opacity-60">{role.location && <span className="flex items-center gap-1"><MapPin size={12} />{role.location}</span>}<span>{role.salary}</span></div>
            </div>
          </Link>
        })}
      </div>
      <Link href="/roles" className="site-button site-accent-bg mx-auto mt-8 flex w-fit items-center gap-2 px-6 py-3 text-[13px] font-semibold text-white md:hidden">{content.roles.linkLabel}<ArrowRight size={14} /></Link>
    </div>
  </section>
}

function CalloutSection({ content }: { content: WebsiteContent }) {
  return <section className="relative overflow-hidden">
    <img src={content.cta.background.url} alt={content.cta.background.alt} className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: `${content.cta.background.focalX}% ${content.cta.background.focalY}%` }} />
    <div className="absolute inset-0 bg-black/45" />
    <div className="relative z-10 mx-auto grid max-w-6xl gap-px px-6 py-24 md:grid-cols-2 lg:px-8">
      {([content.cta.talent, content.cta.employer] as const).map(card => <div key={card.eyebrow} className="bg-white p-8 md:p-12">
        <Eyebrow>{card.eyebrow}</Eyebrow>
        <h3 className="site-heading mb-5 text-[28px] font-medium leading-[1.08] md:text-[34px]">{card.heading}</h3>
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
        <h3 className="site-heading mb-4 text-[26px] leading-[1.08]">{card.heading}</h3>
        <p className="mb-8 flex-1 text-[14px] leading-[1.75] opacity-65">{card.text}</p>
        <Link href={card.buttonHref} className="site-button site-accent-bg w-fit px-5 py-3 text-[12px] font-semibold text-white">{card.buttonLabel}</Link>
      </article>)}
    </div>
  </section>
}

function TestimonialsSection({ content }: { content: WebsiteContent }) {
  return <section className="site-section" style={{ background: 'var(--site-background)' }}>
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-12 text-center"><Eyebrow>{content.testimonials.eyebrow}</Eyebrow><h2 className="site-heading text-[34px] font-medium md:text-[48px]">{content.testimonials.heading}</h2></div>
      <TestimonialCarousel />
      <div className="mt-9 text-center"><Link href="/testimonials" className="text-[13px] underline underline-offset-4 opacity-60 hover:opacity-100">{content.testimonials.linkLabel}</Link></div>
    </div>
  </section>
}

type HomePageProps = { searchParams?: Promise<{ websitePreview?: string | string[] }> }

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const previewRequested = searchParams?.websitePreview === 'draft'
  const previewingDraft = previewRequested && (await canPreviewDraft())
  const [content, featuredRoles] = await Promise.all([getWebsiteContent(previewingDraft), getFeaturedRoles()])

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
    <main className="pt-[60px]">
      {previewingDraft && <div className="site-accent-bg px-5 py-2 text-center text-[12px] font-semibold text-white">Private draft preview — the public website has not changed.</div>}
      <HeroCarousel siteContent={content} />
      <SponsoredAd placement="homepage_spotlight" />
      {content.sections.filter(section => section.visible).map(section => <div key={section.id}>{sections[section.id]}</div>)}
    </main>
    <Footer siteContent={content} />
  </div>
}
