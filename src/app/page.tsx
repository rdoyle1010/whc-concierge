import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MapPin, ArrowRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import HomepageHowItWorks from '@/components/HomepageHowItWorks'

export const revalidate = 300 // revalidate every 5 minutes

async function getStats() {
  try {
    const supabase = createServerSupabaseClient()
    const [talent, roles, employers] = await Promise.all([
      supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true),
      supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
    ])
    return {
      professionals: (talent.count || 0) + 50,
      roles: roles.count || 0,
      employers: (employers.count || 0) + 10,
    }
  } catch { return { professionals: 50, roles: 0, employers: 10 } }
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

const TRUST_BRANDS = ['Champneys', 'Pennyhill Park', 'The Lanesborough', 'Mandarin Oriental', 'Gleneagles', 'Corinthia', 'Four Seasons', 'Rosewood', 'ESPA', 'Fairmont']

export default async function HomePage() {
  const [stats, featuredRoles] = await Promise.all([getStats(), getFeaturedRoles()])

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="pt-[60px] relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)' }}>
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-36 text-center">
          <div className="w-10 h-[1px] bg-[#C9A96E] mx-auto mb-8" />
          <h1 className="text-[40px] md:text-[56px] lg:text-[64px] font-medium text-white leading-[1.08] tracking-tight mb-6 max-w-4xl mx-auto">
            Where Luxury Wellness Meets <span style={{ color: '#C9A96E' }}>Exceptional Talent</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-white/45 leading-[1.7] max-w-2xl mx-auto mb-10">
            The UK&apos;s premier platform connecting elite spa and wellness professionals with prestigious employers
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/register/employer" className="group relative px-7 py-3 rounded-lg text-[14px] font-semibold overflow-hidden transition-all hover:shadow-lg hover:shadow-[#C9A96E]/20" style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)', color: '#0a0a14' }}>
              <span className="relative z-10">Find Talent</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, #E8D5A8, #C9A96E)' }} />
            </Link>
            <Link href="/roles" className="px-7 py-3 border border-white/20 text-white/70 rounded-lg text-[14px] font-medium hover:border-white/40 hover:text-white transition-all">
              Find Roles <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ LIVE STATS BAR ═══ */}
      <section style={{ background: '#0f0f1e' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {[
              { value: `${stats.professionals}+`, label: 'Professionals' },
              { value: `${stats.roles}`, label: 'Live Roles' },
              { value: `${stats.employers}+`, label: 'Premium Employers' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[24px] md:text-[32px] font-semibold" style={{ color: '#C9A96E' }}>{s.value}</p>
                <p className="text-[11px] md:text-[12px] text-white/30 tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>How it works</p>
            <h2 className="text-[32px] md:text-[40px] font-medium text-ink tracking-tight leading-[1.1]">Three steps to your next chapter</h2>
          </div>
          <HomepageHowItWorks />
        </div>
      </section>

      {/* ═══ TRUST SIGNALS ═══ */}
      <section className="py-16 border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="text-[11px] tracking-[0.12em] uppercase text-muted text-center mb-8">Trusted by leading wellness brands across the UK</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_BRANDS.map(name => (
              <span key={name} className="text-[14px] font-medium tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.25)' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED ROLES ═══ */}
      {featuredRoles.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>Latest opportunities</p>
                <h2 className="text-[32px] md:text-[40px] font-medium text-ink tracking-tight leading-[1.1]">Featured roles</h2>
              </div>
              <Link href="/roles" className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink transition-colors">View all roles <ArrowRight size={13} /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredRoles.map((role: any) => (
                <Link key={role.id} href="/roles" className="group border border-border rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${role.tier === 'Platinum' ? 'bg-ink text-white' : role.tier === 'Gold' ? 'bg-[#FDF6EC] text-[#C9A96E]' : 'bg-surface text-muted'}`}>{role.tier}</span>
                    {role.type && <span className="text-[11px] text-muted capitalize">{role.type}</span>}
                  </div>
                  <p className="text-[11px] text-muted uppercase tracking-wide mb-1">{role.property}</p>
                  <h3 className="text-[18px] font-medium text-ink mb-3 group-hover:text-[#C9A96E] transition-colors">{role.title}</h3>
                  <div className="flex items-center gap-3 text-[12px] text-muted">
                    {role.location && <span className="flex items-center gap-1"><MapPin size={11} />{role.location}</span>}
                    <span className="font-medium text-ink">{role.salary}</span>
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

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24" style={{ background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Talent CTA */}
            <div className="rounded-xl p-8 md:p-10" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>For talent</p>
              <h3 className="text-[24px] md:text-[28px] font-medium text-white leading-[1.15] mb-4">Ready to elevate your wellness career?</h3>
              <p className="text-[14px] text-white/40 leading-[1.7] mb-8">Create your free profile, get matched with premium roles, and take the next step in your career.</p>
              <Link href="/register/talent" className="inline-block px-6 py-2.5 bg-white text-[#0a0a14] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors">Create free profile</Link>
            </div>
            {/* Employer CTA */}
            <div className="rounded-xl p-8 md:p-10" style={{ border: '1px solid rgba(201, 169, 110, 0.2)', background: 'rgba(201, 169, 110, 0.05)' }}>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>For employers</p>
              <h3 className="text-[24px] md:text-[28px] font-medium text-white leading-[1.15] mb-4">Ready to find exceptional talent?</h3>
              <p className="text-[14px] text-white/40 leading-[1.7] mb-8">Post your roles, search verified candidates, and hire with confidence using intelligent matching.</p>
              <Link href="/register/employer" className="inline-block px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all hover:shadow-lg hover:shadow-[#C9A96E]/20" style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)', color: '#0a0a14' }}>Post a role</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
