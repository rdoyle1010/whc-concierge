import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MapPin, ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import HomepageHowItWorks from '@/components/HomepageHowItWorks'
import HeroCarousel from '@/components/HeroCarousel'
import TestimonialCarousel from '@/components/TestimonialCarousel'

export const revalidate = 60

type Stats = { professionals: number | null; roles: number | null; properties: number | null }

async function getStats(): Promise<Stats> {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const supabase = createServerSupabaseClient()
    const [talent, roles, properties] = await Promise.all([
      supabase
        .from('candidate_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('profile_visible', true),
      supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_live', true)
        .or(`application_deadline.is.null,application_deadline.gte.${today}`),
      supabase
        .from('employer_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'approved'),
    ])
    return {
      professionals: talent.error ? null : talent.count ?? null,
      roles: roles.error ? null : roles.count ?? null,
      properties: properties.error ? null : properties.count ?? null,
    }
  } catch {
    return { professionals: null, roles: null, properties: null }
  }
}

async function getFeaturedRoles() {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('job_listings')
      .select('id, job_title, job_description, location, salary_min, salary_max, contract_type, tier, employer_profiles(company_name, property_name)')
      .eq('is_live', true)
      .order('posted_date', { ascending: false })
      .limit(3)
    return (data || []).map((j: any) => ({
      id: j.id,
      title: j.job_title || 'Untitled Role',
      property: j.employer_profiles?.property_name || j.employer_profiles?.company_name || '',
      location: j.location || '',
      salary: j.salary_min && j.salary_max ? `£${Math.round(j.salary_min / 1000)}k–£${Math.round(j.salary_max / 1000)}k` : 'Competitive',
      type: j.contract_type?.replace('_', ' ') || '',
      tier: j.tier || 'Standard',
    }))
  } catch { return [] }
}

const DEFAULT_FEATURED = [
  'https://plus.unsplash.com/premium_photo-1663100126765-1ad02ca4ff69?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1647960563439-0160d88ca2b7?w=600&q=80&auto=format&fit=crop',
]
const DEFAULT_CTA_BG = 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1920&q=80&auto=format&fit=crop'

async function getSiteImages() {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('site_images')
      .select('slot, image_url')
      .in('slot', ['featured_1', 'featured_2', 'featured_3', 'cta_bg'])
    const map: Record<string, string> = {}
    for (const row of data || []) map[row.slot] = row.image_url
    return {
      featured: [
        map['featured_1'] || DEFAULT_FEATURED[0],
        map['featured_2'] || DEFAULT_FEATURED[1],
        map['featured_3'] || DEFAULT_FEATURED[2],
      ],
      ctaBg: map['cta_bg'] || DEFAULT_CTA_BG,
    }
  } catch {
    return { featured: DEFAULT_FEATURED, ctaBg: DEFAULT_CTA_BG }
  }
}

const TRUST_BRANDS = ['Champneys', 'Pennyhill Park', 'The Lanesborough', 'Mandarin Oriental', 'Gleneagles', 'Corinthia', 'Four Seasons', 'Rosewood', 'ESPA', 'Fairmont']

export default async function HomePage() {
  const [stats, featuredRoles, siteImages] = await Promise.all([getStats(), getFeaturedRoles(), getSiteImages()])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══ HERO CAROUSEL — Single unified hero ═══ */}
      <div className="pt-[60px]">
        <HeroCarousel />
      </div>

      {/* ═══ LIVE STATS BAR ═══ */}
      {(() => {
        const items = [
          { value: stats.professionals, label: 'Vetted Professionals' },
          { value: stats.roles, label: 'Live Roles' },
          { value: stats.properties, label: 'Verified Properties' },
        ].filter((s): s is { value: number; label: string } => typeof s.value === 'number' && s.value > 0)
        if (items.length === 0) return null
        return (
          <section className="border-y" style={{ background: '#F8F7F5', borderColor: '#E8E5E0' }}>
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
              <div className="flex items-center justify-center gap-8 md:gap-16">
                {items.map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[24px] md:text-[32px] font-semibold" style={{ color: '#C9A96E' }}>{s.value}</p>
                    <p className="text-[11px] md:text-[12px] tracking-wide uppercase" style={{ color: '#6B7280' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-12 items-stretch">
            {/* Left: copy + steps */}
            <div className="lg:col-span-5">
              <div className="mb-10">
                <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>How it works</p>
                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight leading-[1.1]" style={{ color: '#1a1a1a' }}>Three steps to your next chapter</h2>
              </div>
              <HomepageHowItWorks />
            </div>

            {/* Right: luxury imagery (decorative) */}
            <div className="lg:col-span-7 hidden sm:block">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80&auto=format&fit=crop"
                alt=""
                aria-hidden="true"
                className="w-full h-full max-h-[600px] object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST SIGNALS ═══ */}
      <section className="py-16" style={{ background: '#F8F7F5', borderTop: '1px solid #E8E5E0', borderBottom: '1px solid #E8E5E0' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="w-[60px] h-[1px] mx-auto mb-6" style={{ backgroundColor: '#C9A96E' }} />
          <p className="text-[11px] tracking-[0.12em] uppercase text-center mb-8" style={{ color: '#6B7280' }}>Built for properties of this calibre.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_BRANDS.map(name => (
              <span key={name} className="text-[15px] font-medium" style={{ color: '#2D2D2D', opacity: 0.55, letterSpacing: '0.08em' }}>{name}</span>
            ))}
          </div>
          <p className="text-[11px] italic text-center mt-6 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            Property names shown are representative of the calibre WHC Concierge is built to serve. Active partnerships are listed under the relevant role on Browse Roles.
          </p>
        </div>
      </section>

      {/* ═══ FEATURED ROLES ═══ */}
      {featuredRoles.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>Latest opportunities</p>
                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight leading-[1.1]" style={{ color: '#1a1a1a' }}>Featured roles</h2>
              </div>
              <Link href="/roles" className="hidden md:flex items-center gap-1.5 text-[13px] font-medium transition-colors" style={{ color: '#6B7280' }}>View all roles <ArrowRight size={13} /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredRoles.map((role: any, i: number) => (
                <Link key={role.id} href="/roles" className="group rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white" style={{ border: '1px solid #E5E5E5' }}>
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={siteImages.featured[i % 3]}
                      alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                  </div>
                  <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${role.tier === 'Platinum' ? 'bg-ink text-white' : role.tier === 'Gold' ? 'bg-[#FDF6EC] text-[#C9A96E]' : 'bg-surface text-muted'}`}>{role.tier}</span>
                    {role.type && <span className="text-[11px] capitalize" style={{ color: '#6B7280' }}>{role.type}</span>}
                  </div>
                  <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>{role.property}</p>
                  <h3 className="text-[18px] font-medium mb-3 transition-colors" style={{ color: '#1a1a1a' }}>{role.title}</h3>
                  <div className="flex items-center gap-3 text-[12px]" style={{ color: '#6B7280' }}>
                    {role.location && <span className="flex items-center gap-1"><MapPin size={11} />{role.location}</span>}
                    <span className="font-medium" style={{ color: '#C9A96E' }}>{role.salary}</span>
                  </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link href="/roles" className="btn-secondary inline-flex items-center gap-1.5">View all roles <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FINAL CTA — Luxury imagery with white overlay ═══ */}
      <section className="relative overflow-hidden">
        <img
          src={siteImages.ctaBg}
          alt="" className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/85" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl p-8 md:p-10 bg-white/90 backdrop-blur-sm" style={{ border: '1px solid #E5E5E5' }}>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>For talent</p>
              <h3 className="text-[24px] md:text-[28px] font-medium leading-[1.15] mb-4" style={{ color: '#1a1a1a' }}>Ready to elevate your wellness career?</h3>
              <p className="text-[14px] leading-[1.7] mb-8" style={{ color: '#6B7280' }}>Create your free profile, get matched with premium roles, and take the next step in your career.</p>
              <Link href="/register/talent" className="btn-primary inline-block">Create free profile</Link>
            </div>
            <div className="rounded-xl p-8 md:p-10 bg-white/90 backdrop-blur-sm" style={{ border: '1px solid rgba(201, 169, 110, 0.35)' }}>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>For employers</p>
              <h3 className="text-[24px] md:text-[28px] font-medium leading-[1.15] mb-4" style={{ color: '#1a1a1a' }}>Ready to find exceptional talent?</h3>
              <p className="text-[14px] leading-[1.7] mb-8" style={{ color: '#6B7280' }}>Post your roles, search verified candidates, and hire with confidence using intelligent matching.</p>
              <Link href="/register/employer"
                className="inline-block px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
                style={{ backgroundColor: '#C9A96E' }}>
                Post a role
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AGENCY & RESIDENCY */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-hover p-8">
            <p className="eyebrow mb-3">Agency marketplace</p>
            <h3 className="text-[24px] font-medium text-ink leading-tight mb-3">Fill shifts instantly.<br />No agency fees.</h3>
            <p className="text-secondary text-[14px] mb-6">Find verified practitioners in your area, book directly, confirm instantly. Radius search by postcode. 10% platform fee only on confirmed bookings.</p>
            <Link href="/agency" className="btn-primary inline-block">Browse practitioners</Link>
          </div>
          <div className="card-hover p-8">
            <p className="eyebrow mb-3">Residency programme</p>
            <h3 className="text-[24px] font-medium text-ink leading-tight mb-3">Discover visiting<br />specialists.</h3>
            <p className="text-secondary text-[14px] mb-6">Browse the residency talent pool, contact practitioners directly, agree terms. Elite 1-6 month placements at iconic properties worldwide.</p>
            <Link href="/residency" className="btn-primary inline-block">Explore residencies</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="eyebrow mb-3">What people say</p>
            <h2 className="text-[36px] md:text-[42px] font-medium text-ink leading-[1.12] tracking-tight">Trusted by the industry.</h2>
          </div>
          <TestimonialCarousel />
          <div className="text-center mt-8">
            <Link href="/testimonials" className="text-[13px] text-muted hover:text-ink transition-colors underline underline-offset-4">Read all testimonials</Link>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  )
}
