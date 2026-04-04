'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Star, Check, Briefcase, MapPin, Users, Clock } from 'lucide-react'

export default function HomePage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ properties: 0, roles: 0 })
  const [heroJob, setHeroJob] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [p, j] = await Promise.all([
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true),
      ])
      setStats({ properties: p.count || 0, roles: j.count || 0 })

      // Load a real featured job for the hero card
      const { data: topJobs } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (topJobs && topJobs.length > 0) {
        const j = topJobs[0]
        setHeroJob({
          title: j.job_title || j.title || 'Senior Spa Therapist',
          company: j.employer_profiles?.property_name || j.employer_profiles?.company_name || 'Luxury Property',
          location: j.location || 'UK',
          salary: j.salary_min && j.salary_max ? `£${Math.round(j.salary_min/1000)}k–£${Math.round(j.salary_max/1000)}k` : 'Competitive',
          tier: j.tier || 'Platinum',
          brands: j.required_brands || j.required_product_houses || [],
          qualifications: j.required_qualifications || [],
          jobType: j.job_type || 'Full-time',
        })
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══════ S1: HERO ═══════ */}
      <section className="pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <p className="eyebrow mb-5 animate-fade-in-up">The luxury wellness careers platform</p>
              <h1 className="text-[44px] md:text-[52px] font-medium text-ink leading-[1.1] tracking-tight mb-6 animate-fade-in-up delay-100">
                The right match.<br />Every time.
              </h1>
              <p className="text-[16px] text-secondary leading-[1.7] max-w-[480px] mb-8 animate-fade-in-up delay-200">
                WHC Concierge connects exceptional spa and wellness professionals with the world&apos;s finest properties — using intelligent matching that understands your world.
              </p>
              <div className="flex flex-wrap gap-3 mb-12 animate-fade-in-up delay-300">
                <Link href="/roles/match" className="btn-primary">Find your next role</Link>
                <Link href="/register/employer" className="btn-secondary">Hire exceptional talent</Link>
              </div>
              {/* Stats — real data only */}
              {(stats.properties > 0 || stats.roles > 0) && (
                <div className="flex items-center divide-x divide-border animate-fade-in-up delay-400">
                  <div className="pr-6"><p className="text-[22px] font-semibold text-ink">{stats.properties}</p><p className="text-[12px] text-muted">Properties</p></div>
                  <div className="px-6"><p className="text-[22px] font-semibold text-ink">{stats.roles}</p><p className="text-[12px] text-muted">Active Roles</p></div>
                </div>
              )}
            </div>

            {/* Right: animated match card */}
            <div className="hidden lg:block animate-fade-in-up delay-300">
              <div className="relative ml-auto max-w-[380px]">
                {/* Background card */}
                <div className="absolute inset-x-4 top-4 h-full bg-surface border border-border rounded-xl" />
                {/* Main card */}
                <div className="relative bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="h-[180px] bg-gradient-to-br from-neutral-100 to-neutral-200 relative">
                    <img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                    <span className={`absolute top-3 left-3 ${heroJob?.tier === 'Gold' ? 'badge-gold' : heroJob?.tier === 'Silver' ? 'badge-silver' : 'badge-platinum'}`}>{heroJob?.tier || 'Platinum'}</span>
                    <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>94% Perfect Match</span>
                  </div>
                  <div className="p-5">
                    <p className="eyebrow mb-1">{heroJob?.company || 'Luxury Property'}</p>
                    <h3 className="text-[18px] font-medium text-ink mb-2">{heroJob?.title || 'Senior Spa Therapist'}</h3>
                    <div className="flex items-center gap-3 text-[13px] text-muted mb-4">
                      <span className="flex items-center gap-1"><MapPin size={12} />{heroJob?.location || 'UK'}</span>
                      <span>{heroJob?.jobType || 'Full-time'}</span>
                      <span>{heroJob?.salary || 'Competitive'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(heroJob?.brands?.length > 0 ? heroJob.brands.slice(0, 3) : heroJob?.qualifications?.length > 0 ? heroJob.qualifications.slice(0, 3) : ['View details']).map((t: string) => (
                        <span key={t} className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    {/* Score bars */}
                    <div className="space-y-2">
                      {[{ label: 'Role level', pct: 100 }, { label: 'Product houses', pct: 80 }, { label: 'Qualifications', pct: 100 }, { label: 'Location', pct: 100 }].map((b) => (
                        <div key={b.label} className="flex items-center gap-3">
                          <span className="text-[11px] text-muted w-24">{b.label}</span>
                          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-ink rounded-full" style={{ width: `${b.pct}%` }} /></div>
                          <span className="text-[11px] text-ink font-medium w-8 text-right">{b.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ S2: TRUST BAR ═══════ */}
      <section className="border-y border-border py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-[11px] text-muted uppercase tracking-[0.08em] text-center mb-5">Trusted by the world&apos;s finest properties</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Fairmont', 'Mandarin Oriental', 'Rosewood', 'Four Seasons', 'Corinthia', 'Gleneagles', 'The Lanesborough', 'ESPA'].map((name) => (
              <span key={name} className="text-[12px] text-muted border border-border px-3 py-1.5 rounded-full">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ S3: WHY WHC ═══════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="eyebrow mb-3">Why WHC Concierge</p>
            <h2 className="section-heading mb-4">Not a job board.<br />An intelligent platform.</h2>
            <p className="text-secondary">Built exclusively for luxury wellness. Every feature designed around how this industry actually works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Weighted matching algorithm', body: 'Role level, product house knowledge, qualifications and location — all scored and weighted. A Director of Spa never sees apprentice roles. Never.' },
              { title: 'Stealth mode', body: 'Block your current employer from seeing your profile. Search confidentially without any risk to your current position.' },
              { title: 'Agency by radius', body: 'Find verified practitioners within 5, 10, 20 or 50 miles. Direct booking — no agency fees, no middlemen.' },
            ].map((f) => (
              <div key={f.title} className="card-hover p-7">
                <h3 className="text-[17px] font-medium text-ink mb-3">{f.title}</h3>
                <p className="text-[14px] text-secondary leading-[1.7]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ S4: THE ALGORITHM ═══════ */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="eyebrow mb-3">The matching engine</p>
              <h2 className="text-[36px] md:text-[42px] font-medium text-ink leading-[1.12] tracking-tight mb-5">Intelligent. Transparent.<br />Explained.</h2>
              <p className="text-secondary mb-6">Every match shows a full breakdown — role level, product house alignment, qualifications and location — all scored and weighted so you know exactly why you&apos;re matched.</p>
              <p className="text-secondary">Hard stops prevent irrelevant matches entirely. A Spa Manager never sees apprentice roles. Candidates without insurance are excluded from roles that require it.</p>
            </div>
            {/* Match breakdown card */}
            <div className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <p className="eyebrow">Corinthia London</p>
                  <span className="match-perfect">Perfect Match</span>
                </div>
                <h3 className="text-[20px] font-medium text-ink">Senior Spa Therapist</h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-[56px] font-semibold text-ink leading-none">94</p>
                  <p className="text-[12px] text-muted mt-1">Overall match score</p>
                </div>
                <div className="space-y-4">
                  {[{ label: 'Role level', pct: 100, detail: 'Exact match' }, { label: 'Product houses', pct: 80, detail: '4 of 5 required' }, { label: 'Qualifications', pct: 100, detail: 'All met' }, { label: 'Location', pct: 100, detail: 'Within range' }].map((b) => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-ink font-medium">{b.label}</span>
                        <span className="text-[13px] text-ink font-semibold">{b.pct}%</span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden"><div className="h-full bg-ink rounded-full transition-all" style={{ width: `${b.pct}%` }} /></div>
                      <p className="text-[11px] text-muted mt-0.5">{b.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-muted mt-5 pt-4 border-t border-border">Missing: Comfort Zone certification. Add it to your profile to reach 100%.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ S5: TWO PORTALS ═══════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[36px] md:text-[42px] font-medium text-ink leading-[1.12] tracking-tight">Built for both sides. Equally.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="card-flat p-8">
              <p className="eyebrow mb-3">For talent</p>
              <h3 className="text-[20px] font-medium text-ink mb-3">Find your perfect role</h3>
              <p className="text-[14px] text-secondary mb-6">Create your profile, get matched with roles at luxury properties, and apply with one click.</p>
              <Link href="/register/talent" className="btn-primary inline-block">Create free profile</Link>
            </div>
            <div className="card-flat p-8 bg-ink text-white">
              <p className="text-[11px] tracking-[0.08em] uppercase text-white/50 font-medium mb-3">For employers</p>
              <h3 className="text-[20px] font-medium text-white mb-3">Hire exceptional talent</h3>
              <p className="text-[14px] text-white/60 mb-6">Post roles, search verified candidates, and fill vacancies with intelligent matching.</p>
              <Link href="/register/employer" className="bg-white text-ink px-5 py-2.5 rounded-lg text-[13px] font-medium hover:bg-white/90 transition-colors inline-block">Post a role</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ S6: AGENCY & RESIDENCY ═══════ */}
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
            <p className="text-secondary text-[14px] mb-6">Browse the residency talent pool, contact practitioners directly, agree terms. Elite 1–6 month placements at iconic properties worldwide.</p>
            <Link href="/residency" className="btn-primary inline-block">Explore residencies</Link>
          </div>
        </div>
      </section>

      {/* Social proof section — will show real reviews when available */}

      {/* ═══════ S8: PRICING ═══════ */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-[36px] font-medium text-ink tracking-tight mb-3">Simple, transparent pricing.</h2>
            <p className="text-secondary">Talent profiles are free. Always.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Talent free */}
            <div className="card p-5 lg:col-span-1">
              <p className="eyebrow mb-1">Talent</p>
              <p className="text-[28px] font-semibold text-ink">Free</p>
              <p className="text-[12px] text-muted mb-4">£20/m to feature</p>
              <Link href="/register/talent" className="btn-secondary w-full text-center block text-[12px]">Join free</Link>
            </div>
            {/* Employer tiers */}
            {[
              { name: 'Bronze', price: '£150', days: '30 days' },
              { name: 'Silver', price: '£200', days: '60 days' },
              { name: 'Gold', price: '£225', days: '75 days', pop: true },
              { name: 'Platinum', price: '£250', days: '90 days' },
            ].map((t) => (
              <div key={t.name} className={`card p-5 relative ${t.pop ? 'border-ink' : ''}`}>
                {t.pop && <span className="absolute -top-2.5 right-4 bg-ink text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">Popular</span>}
                <p className="eyebrow mb-1">{t.name}</p>
                <p className="text-[28px] font-semibold text-ink">{t.price}</p>
                <p className="text-[12px] text-muted mb-4">{t.days}</p>
                <Link href="/register/employer" className={`w-full text-center block text-[12px] ${t.pop ? 'btn-primary' : 'btn-secondary'}`}>Get started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ S9: FINAL CTA ═══════ */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-[36px] md:text-[42px] font-medium text-ink leading-[1.12] tracking-tight mb-6">Ready to find your<br />perfect match?</h2>
          <div className="flex justify-center gap-3">
            <Link href="/register/talent" className="btn-primary">Join as talent</Link>
            <Link href="/register/employer" className="btn-secondary">Post a role</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
