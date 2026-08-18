'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Clock, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

export default function ResidencyPage() {
  const [residencies, setResidencies] = useState<any[]>([])
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [specFilter, setSpecFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('submitted') === 'true') setJustSubmitted(true)
    fetch('/api/residency/public')
      .then(res => res.ok ? res.json() : { profiles: [] })
      .then(data => setResidencies(data.profiles || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = residencies.filter(r => {
    if (specFilter) {
      const s = specFilter.toLowerCase()
      const values = [r.primary_specialism, ...(r.secondary_specialisms || [])].filter(Boolean).map((x: string) => x.toLowerCase())
      if (!values.some((x: string) => x.includes(s))) return false
    }
    if (regionFilter && regionFilter !== (r.travel_availability || '')) return false
    return true
  })

  return (
    <div className="public-page">
      <Navbar />
      {justSubmitted && <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20"><div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Listing submitted. It will go live once the Spa Platform team approves it.</div></div>}

      <section className="pt-16 bg-[#F4F0E8] border-b border-border overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.16em] text-accent font-semibold mb-5"><Sparkles size={13}/> Curated Residency Marketplace</div>
            <h1 className="text-[44px] md:text-[62px] lg:text-[72px] leading-[.98] tracking-[-.045em] font-semibold text-ink max-w-4xl">Bring exceptional wellness talent into your property.</h1>
            <p className="text-[16px] md:text-[18px] leading-8 text-secondary max-w-2xl mt-7">Discover experienced specialists for seasonal, short-term and signature residencies. Identity stays protected while you discuss fit, then agreed terms and payment stay securely on Spa Platform.</p>
            <div className="flex flex-wrap gap-3 mt-8"><a href="#specialists" className="btn-primary">Find a Specialist</a><Link href="/residency/create" className="btn-secondary">Join Residency · £10/month</Link></div>
          </div>
          <div className="bg-white/90 border border-white p-7 shadow-sm">
            <p className="eyebrow mb-5">Protected Residency Booking</p>
            <div className="space-y-5">
              <div className="flex gap-4"><ShieldCheck size={18} className="text-accent mt-0.5 shrink-0"/><div><p className="text-sm font-semibold text-ink">Private introductions</p><p className="text-xs text-muted leading-5 mt-1">Specialist identity and direct contact details remain protected before confirmation.</p></div></div>
              <div className="flex gap-4"><CalendarCheck2 size={18} className="text-accent mt-0.5 shrink-0"/><div><p className="text-sm font-semibold text-ink">Structured terms</p><p className="text-xs text-muted leading-5 mt-1">Agree dates, working days, rate, services, accommodation and travel before payment.</p></div></div>
              <div className="flex gap-4"><Sparkles size={18} className="text-accent mt-0.5 shrink-0"/><div><p className="text-sm font-semibold text-ink">Secure platform booking</p><p className="text-xs text-muted leading-5 mt-1">Specialists join for £10/month. Properties pay a 10% booking fee only when a Residency is confirmed.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-border"><div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-9 grid md:grid-cols-4 gap-px bg-border">
        {[{title:'Discover',text:'Browse approved, actively subscribed specialists.'},{title:'Chat',text:'Discuss suitability privately without exchanging direct contact details.'},{title:'Agree',text:'Send a structured offer and negotiate the full Residency terms.'},{title:'Confirm',text:'Pay securely through Spa Platform and lock the booking in.'}].map(({title,text}) => <div key={title} className="bg-white p-5"><p className="text-sm font-semibold text-ink">{title}</p><p className="text-xs text-muted leading-5 mt-1">{text}</p></div>)}
      </div></section>

      <section id="specialists" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-14 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7"><div><p className="eyebrow mb-2">Residency Talent</p><h2 className="text-3xl font-semibold text-ink tracking-tight">Specialists available for placement</h2></div><p className="text-xs text-muted">{filtered.length} specialist{filtered.length !== 1 ? 's' : ''} available</p></div>
        <div className="public-panel p-4 flex flex-wrap gap-3"><input type="text" placeholder="Search treatment, skill or specialism..." value={specFilter} onChange={e => setSpecFilter(e.target.value)} className="input-field !py-2.5 text-[13px] w-auto flex-1 min-w-[220px]"/><select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="input-field !py-2.5 text-[13px] w-auto"><option value="">All regions</option><option value="UK Only">UK Only</option><option value="Europe">Europe</option><option value="Middle East">Middle East</option><option value="Asia Pacific">Asia Pacific</option><option value="Global">Global</option></select></div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 pb-20">
        {loading ? <div className="grid xl:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="skeleton h-72"/>)}</div> : filtered.length === 0 ? <div className="public-panel p-16 text-center"><p className="text-[15px] font-medium text-ink mb-2">No specialists match those filters</p><p className="text-[13px] text-muted">Try another specialism or region.</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{filtered.map(r => {
          const bio = r.bio || ''
          const rate = r.day_rate || (r.weekly_rate ? Math.round(Number(r.weekly_rate) / 5) : null)
          return <article key={r.id} className={`bg-white border p-6 md:p-7 ${r.is_featured ? 'border-accent/40' : 'border-border'}`}>
            <div className="flex gap-5">
              <div className="w-20 h-24 md:w-24 md:h-28 bg-[#F4F0E8] shrink-0 flex items-center justify-center"><UserRound size={30} className="text-accent/70"/></div>
              <div className="min-w-0 flex-1">{r.is_featured && <span className="badge-gold mb-2 inline-block">Featured Residency Talent</span>}<p className="text-[10px] uppercase tracking-[.14em] text-muted">Residency Specialist {r.reference}</p><h3 className="text-[23px] font-semibold text-ink leading-tight mt-1">{r.primary_specialism || 'Wellness Specialist'}</h3><div className="flex flex-wrap gap-3 text-[11px] text-muted mt-3">{r.current_location && <span className="flex items-center gap-1"><MapPin size={11}/>{r.current_location}</span>}{r.preferred_duration && <span className="flex items-center gap-1"><Clock size={11}/>{r.preferred_duration}</span>}{r.travel_availability && <span>Travels: {r.travel_availability}</span>}</div></div>
            </div>
            {bio && <p className="text-[13px] leading-6 text-secondary mt-5">{bio.length > 180 ? `${bio.slice(0,180)}...` : bio}</p>}
            {r.secondary_specialisms?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{r.secondary_specialisms.slice(0,5).map((s:string) => <span key={s} className="text-[10px] px-2.5 py-1 bg-surface text-ink">{s}</span>)}</div>}
            {r.brand_experience?.length > 0 && <p className="text-[11px] text-muted mt-4"><span className="font-medium text-ink">Brand experience:</span> {r.brand_experience.slice(0,4).join(', ')}</p>}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 mt-5 border-t border-border"><div>{rate ? <><p className="text-[10px] uppercase tracking-[.12em] text-muted">Indicative rate</p><p className="text-lg font-semibold text-ink">£{rate}<span className="text-xs font-normal text-muted">/day</span></p></> : <p className="text-xs text-muted">Rate available on profile</p>}</div><div className="flex gap-2"><Link href={`/residency/${r.id}`} className="btn-secondary !py-2.5 !px-4 text-xs">View Profile</Link><Link href={`/residency/${r.id}#enquire`} className="btn-primary !py-2.5 !px-4 text-xs">Start Private Chat</Link></div></div>
          </article>
        })}</div>}
      </section>
      <Footer />
    </div>
  )
}
