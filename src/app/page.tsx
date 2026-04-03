'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Star, Check, Briefcase, MapPin, Users, Clock } from 'lucide-react'

export default function HomePage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'talent' | 'employer'>('talent')
  const [stats, setStats] = useState({ properties: 0, roles: 0 })

  useEffect(() => {
    async function load() {
      const [p, j] = await Promise.all([
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setStats({ properties: p.count || 0, roles: j.count || 0 })
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
              {/* Stats */}
              <div className="flex items-center divide-x divide-border animate-fade-in-up delay-400">
                <div className="pr-6"><p className="text-[22px] font-semibold text-ink">{stats.properties || '480'}+</p><p className="text-[12px] text-muted">Properties</p></div>
                <div className="px-6"><p className="text-[22px] font-semibold text-ink">96%</p><p className="text-[12px] text-muted">Match accuracy</p></div>
                <div className="pl-6"><p className="text-[22px] font-semibold text-ink">72hrs</p><p className="text-[12px] text-muted">Avg time to hire</p></div>
              </div>
            </div>

            {/* Right: animated match card */}
            <div className="hidden lg:block animate-fade-in-up delay-300">
              <div className="relative ml-auto max-w-[380px]">
                {/* Background card */}
                <div className="absolute inset-x-4 top-4 h-full bg-surface border border-border rounded-xl" />
                {/* Main card */}
                <div className="relative bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="h-[180px] bg-gradient-to-br from-neutral-100 to-neutral-200 relative">
                    <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 badge-platinum">Platinum</span>
                    <span className="absolute top-3 right-3 match-perfect">94% Perfect Match</span>
                  </div>
                  <div className="p-5">
                    <p className="eyebrow mb-1">Corinthia London</p>
                    <h3 className="text-[18px] font-medium text-ink mb-2">Senior Spa Therapist</h3>
                    <div className="flex items-center gap-3 text-[13px] text-muted mb-4">
                      <span className="flex items-center gap-1"><MapPin size={12} />London</span>
                      <span>Full-time</span>
                      <span>£32k–£38k</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['ESPA', 'CIDESCO', 'Hot Stone'].map((t) => (
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
          {/* Tabs */}
          <div className="flex justify-center gap-1 bg-surface rounded-lg p-1 w-fit mx-auto mb-10">
            <button onClick={() => setTab('talent')} className={`px-5 py-2 rounded-md text-[13px] font-medium transition-colors ${tab === 'talent' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>I&apos;m looking for work</button>
            <button onClick={() => setTab('employer')} className={`px-5 py-2 rounded-md text-[13px] font-medium transition-colors ${tab === 'employer' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>I&apos;m hiring talent</button>
          </div>

          {tab === 'talent' ? (
            <div className="card p-8 max-w-3xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ n: '12', l: 'Matches' }, { n: '3', l: 'Applications' }, { n: '847', l: 'Profile views' }, { n: '4.9', l: 'Star rating' }].map((s) => (
                  <div key={s.l} className="text-center p-4 bg-surface rounded-lg"><p className="text-[22px] font-semibold text-ink">{s.n}</p><p className="text-[11px] text-muted">{s.l}</p></div>
                ))}
              </div>
              <p className="eyebrow mb-3">Your top matches</p>
              <div className="space-y-3">
                {[
                  { role: 'Senior Spa Therapist', prop: 'Corinthia London', score: 94, label: 'Perfect' },
                  { role: 'Spa Manager', prop: 'Gleneagles', score: 87, label: 'Strong' },
                  { role: 'Wellness Practitioner', prop: 'Mandarin Oriental', score: 78, label: 'Strong' },
                ].map((m) => (
                  <div key={m.role} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div><p className="text-[14px] font-medium text-ink">{m.role}</p><p className="text-[12px] text-muted">{m.prop}</p></div>
                    <span className={m.score >= 90 ? 'match-perfect' : m.score >= 75 ? 'match-strong' : 'match-good'}>{m.score}% {m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 max-w-3xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ n: '4', l: 'Active listings' }, { n: '28', l: 'Candidates matched' }, { n: '12', l: 'Messages' }, { n: '89%', l: 'Hire rate' }].map((s) => (
                  <div key={s.l} className="text-center p-4 bg-surface rounded-lg"><p className="text-[22px] font-semibold text-ink">{s.n}</p><p className="text-[11px] text-muted">{s.l}</p></div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/employer/post-role" className="btn-primary flex-1 text-center">Post a new role</Link>
                <Link href="/agency" className="btn-secondary flex-1 text-center">Find agency cover</Link>
              </div>
            </div>
          )}
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

      {/* ═══════ S7: SOCIAL PROOF ═══════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-[36px] font-medium text-ink tracking-tight">What our community says</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: 'WHC matched me with my dream role at Corinthia within a week. The algorithm genuinely understands this industry.', name: 'Sophie L.', role: 'Senior Spa Therapist', prop: 'Corinthia London', stars: 5 },
              { quote: 'We filled three positions in under 10 days. The quality of candidates is leagues above any recruiter we\'ve used.', name: 'James H.', role: 'Spa Director', prop: 'Gleneagles', stars: 5 },
              { quote: 'The agency feature saved us during peak season. Two therapists booked within hours, both brilliant.', name: 'Emma R.', role: 'Operations Manager', prop: 'The Lanesborough', stars: 5 },
            ].map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} className="text-amber-400" fill="currentColor" />)}</div>
                <p className="text-[14px] text-secondary leading-[1.7] mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div><p className="text-[13px] font-medium text-ink">{t.name}</p><p className="text-[12px] text-muted">{t.role}, {t.prop}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
