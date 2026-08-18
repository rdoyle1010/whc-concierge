'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

export default function ResidencyPage() {
  const supabase = createClient()
  const [residencies, setResidencies] = useState<any[]>([])
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [specFilter, setSpecFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('submitted') === 'true') setJustSubmitted(true)
  }, [])

  useEffect(() => {
    supabase.from('residency_profiles').select('*')
      .or('approval_status.eq.approved,approval_status.is.null')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setResidencies(data || []); setLoading(false) })
  }, [supabase])

  const filtered = residencies.filter(r => {
    if (specFilter) {
      const s = specFilter.toLowerCase()
      const values = [r.primary_specialism, ...(r.secondary_specialisms || []), ...(r.services_offered || [])].filter(Boolean).map((x: string) => x.toLowerCase())
      if (!values.some((x: string) => x.includes(s))) return false
    }
    if (regionFilter && regionFilter !== (r.will_travel_to || r.travel_availability || '')) return false
    return true
  })

  return (
    <div className="public-page">
      <Navbar />
      {justSubmitted && <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20"><div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-2xl shadow-sm">Listing submitted. It will go live once the Spa Platform team approves it.</div></div>}

      <section className="pt-16 bg-[#F4F0E8] border-b border-border overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-center">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.16em] text-accent font-semibold mb-5"><Sparkles size={13}/> Curated Residency Marketplace</div>
            <h1 className="text-[44px] md:text-[62px] lg:text-[72px] leading-[.98] tracking-[-.045em] font-semibold text-ink max-w-4xl">Bring exceptional wellness talent into your property.</h1>
            <p className="text-[16px] md:text-[18px] leading-8 text-secondary max-w-2xl mt-7">Discover experienced specialists for seasonal, short-term and signature residencies. Agree dates and rates on-platform, confirm securely and build a verified residency history.</p>
            <div className="flex flex-wrap gap-3 mt-8"><a href="#specialists" className="btn-primary">Find a Specialist</a><Link href="/residency/create" className="btn-secondary">Join Residency · £10/month</Link></div>
          </div>
          <div className="bg-white/85 backdrop-blur border border-white rounded-[28px] p-7 shadow-xl shadow-black/5">
            <p className="eyebrow mb-5">How Spa Platform Earns</p>
            <div className="space-y-5">
              <div className="flex gap-4"><div className="w-9 h-9 rounded-xl bg-parchment flex items-center justify-center shrink-0"><span className="text-accent font-semibold">1</span></div><div><p className="text-sm font-semibold text-ink">Talent membership</p><p className="text-xs text-muted leading-5 mt-1">Specialists pay £10/month to be listed and receive residency offers.</p></div></div>
              <div className="flex gap-4"><div className="w-9 h-9 rounded-xl bg-parchment flex items-center justify-center shrink-0"><span className="text-accent font-semibold">2</span></div><div><p className="text-sm font-semibold text-ink">10% booking fee</p><p className="text-xs text-muted leading-5 mt-1">The property pays a 10% platform fee only after the residency terms are accepted.</p></div></div>
              <div className="flex gap-4"><div className="w-9 h-9 rounded-xl bg-parchment flex items-center justify-center shrink-0"><ShieldCheck size={16} className="text-accent"/></div><div><p className="text-sm font-semibold text-ink">Booking stays protected</p><p className="text-xs text-muted leading-5 mt-1">Rates, dates and inclusions are recorded before payment and verified reviews follow completed bookings.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-border"><div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-9 grid md:grid-cols-3 gap-4">
        {[{icon:CalendarCheck2,title:'Invite',text:'Send dates, working days, proposed rate and inclusions.'},{icon:ArrowRight,title:'Agree',text:'Specialists can accept, counter or decline inside Spa Platform.'},{icon:ShieldCheck,title:'Confirm',text:'Once agreed, the property pays securely and the booking is locked in.'}].map(({icon:Icon,title,text}) => <div key={title} className="rounded-2xl border border-border p-5"><Icon size={18} className="text-accent mb-3"/><p className="text-sm font-semibold text-ink">{title}</p><p className="text-xs text-muted leading-5 mt-1">{text}</p></div>)}
      </div></section>

      <section id="specialists" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-14 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7"><div><p className="eyebrow mb-2">Residency Talent</p><h2 className="text-3xl font-semibold text-ink tracking-tight">Specialists available for placement</h2></div><p className="text-xs text-muted">{filtered.length} specialist{filtered.length !== 1 ? 's' : ''} available</p></div>
        <div className="public-panel p-4 flex flex-wrap gap-3"><input type="text" placeholder="Search treatment, skill or specialism..." value={specFilter} onChange={e => setSpecFilter(e.target.value)} className="input-field !py-2.5 text-[13px] w-auto flex-1 min-w-[220px]"/><select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="input-field !py-2.5 text-[13px] w-auto"><option value="">All regions</option><option value="UK Only">UK Only</option><option value="Europe">Europe</option><option value="Middle East">Middle East</option><option value="Asia Pacific">Asia Pacific</option><option value="Global">Global</option></select></div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 pb-20">
        {loading ? <div className="grid xl:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="skeleton h-72 rounded-2xl"/>)}</div> : filtered.length === 0 ? <div className="public-panel p-16 text-center"><p className="text-[15px] font-medium text-ink mb-2">No specialists match those filters</p><p className="text-[13px] text-muted">Try another specialism or region.</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">{filtered.map(r => {
          const name = r.full_name || r.title || 'Specialist'
          const bio = r.bio || r.description || ''
          const secondarySpecs = r.secondary_specialisms || r.services_offered || []
          const brands = r.brand_experience || r.product_houses || []
          const location = r.current_location || ''
          const travelTo = r.will_travel_to || r.travel_availability || ''
          const duration = r.preferred_duration || r.duration || ''
          const rate = r.day_rate || (r.weekly_rate ? Math.round(Number(r.weekly_rate) / 5) : null)
          return <article key={r.id} className={`bg-white border rounded-[24px] p-6 md:p-7 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 ${r.is_featured ? 'border-accent/40' : 'border-border'}`}>
            <div className="flex gap-5">
              <div className="w-24 h-28 md:w-28 md:h-32 rounded-2xl overflow-hidden bg-parchment shrink-0">{(r.profile_photo_url || r.photo_url || r.photos?.[0]) ? <img src={r.profile_photo_url || r.photo_url || r.photos?.[0]} alt={name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl text-accent font-semibold">{name.trim().charAt(0).toUpperCase()}</div>}</div>
              <div className="min-w-0 flex-1">{r.is_featured && <span className="badge-gold mb-2 inline-block">Featured Residency Talent</span>}<h3 className="text-[23px] font-semibold text-ink leading-tight">{name}</h3>{r.primary_specialism && <p className="text-[13px] text-accent font-medium mt-1">{r.primary_specialism}</p>}<div className="flex flex-wrap gap-3 text-[11px] text-muted mt-3">{location && <span className="flex items-center gap-1"><MapPin size={11}/>{location}</span>}{duration && <span className="flex items-center gap-1"><Clock size={11}/>{duration}</span>}{travelTo && <span>Travels: {travelTo}</span>}</div></div>
            </div>
            {bio && <p className="text-[13px] leading-6 text-secondary mt-5">{bio.length > 180 ? `${bio.slice(0,180)}...` : bio}</p>}
            {secondarySpecs.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{secondarySpecs.slice(0,5).map((s:string) => <span key={s} className="text-[10px] px-2.5 py-1 rounded-full bg-surface text-ink">{s}</span>)}</div>}
            {brands.length > 0 && <p className="text-[11px] text-muted mt-4"><span className="font-medium text-ink">Brand experience:</span> {brands.slice(0,4).join(', ')}</p>}
            <div className="flex items-center justify-between gap-4 pt-5 mt-5 border-t border-border"><div>{rate ? <><p className="text-[10px] uppercase tracking-[.12em] text-muted">From</p><p className="text-lg font-semibold text-ink">£{rate}<span className="text-xs font-normal text-muted">/day</span></p></> : <p className="text-xs text-muted">Rate on profile</p>}</div><div className="flex gap-2"><Link href={`/residency/${r.id}`} className="btn-secondary !py-2.5 !px-4 text-xs">View Profile</Link><Link href={`/residency/${r.id}#enquire`} className="btn-primary !py-2.5 !px-4 text-xs">Invite to Residency</Link></div></div>
          </article>
        })}</div>}
      </section>
      <Footer />
    </div>
  )
}
