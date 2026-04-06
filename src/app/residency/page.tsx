'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Clock, MapPin, X, Star, Award, Briefcase, ArrowRight } from 'lucide-react'

const avatarPhotos = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200&q=80&auto=format&fit=crop',
]

export default function ResidencyPage() {
  const supabase = createClient()
  const [residencies, setResidencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnquiry, setShowEnquiry] = useState<any>(null)
  const [specFilter, setSpecFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    supabase.from('residency_profiles').select('*')
      .or('approval_status.eq.approved,approval_status.is.null')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setResidencies(data || []); setLoading(false) })
  }, [])

  const filtered = residencies.filter(r => {
    if (specFilter && !(r.services_offered || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    if (regionFilter && r.travel_availability !== regionFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Residency Programme</p>
          <h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">Residency Specialists</h1>
          <p className="text-[15px] text-secondary max-w-2xl mx-auto mb-8">Award-winning wellness professionals available for seasonal and short-term placements at your property</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/residency/create" className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#C9A96E' }}>List Your Availability</Link>
            <a href="#specialists" className="btn-secondary">Browse Specialists</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border py-6" style={{ background: '#F8F7F5' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 flex items-center justify-center gap-8 md:gap-16 text-center">
          {[{ n: '15+', l: 'Years Average Experience' }, { n: 'UK & Europe', l: 'Placement Regions' }, { n: '5-Star', l: 'Property Partners' }].map(s => (
            <div key={s.l}><p className="text-[20px] font-semibold" style={{ color: '#C9A96E' }}>{s.n}</p><p className="text-[11px] text-muted">{s.l}</p></div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section id="specialists" className="max-w-5xl mx-auto px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Filter by specialism..." value={specFilter} onChange={e => setSpecFilter(e.target.value)}
            className="input-field !py-2 text-[13px] w-auto flex-1 min-w-[200px]" />
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="input-field !py-2 text-[13px] w-auto">
            <option value="">All regions</option>
            <option value="uk_only">UK Only</option>
            <option value="uk_and_europe">UK & Europe</option>
            <option value="worldwide">Worldwide</option>
          </select>
        </div>
        <p className="text-[12px] text-muted mt-3">{filtered.length} specialist{filtered.length !== 1 ? 's' : ''} available</p>
      </section>

      {/* Listings */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-6 pb-16">
        {loading ? (
          <div className="space-y-6">{[1,2,3].map(i => <div key={i} className="skeleton h-56 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-16 text-center">
            <p className="text-[15px] font-medium text-ink mb-2">No specialists available yet</p>
            <p className="text-[13px] text-muted mb-6">Be the first to list your residency availability.</p>
            <Link href="/residency/create" className="btn-primary inline-block">Create a Listing</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((r, i) => (
              <div key={r.id} className={`bg-white border rounded-xl p-6 md:p-8 hover:shadow-md transition-all ${r.is_featured ? 'border-[#C9A96E]/30 ring-1 ring-[#C9A96E]/10' : 'border-border'}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-surface border-2 border-white shadow-md">
                      <img src={r.photo_url || r.photos?.[0] || avatarPhotos[i % avatarPhotos.length]} alt="" className="w-full h-full object-cover" />
                    </div>
                    {r.is_featured && <span className="mt-2 text-[9px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E' }}>Featured</span>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[20px] font-medium text-ink mb-1 leading-snug">{r.title}</h3>
                    {r.description && <p className="text-[14px] text-secondary leading-[1.7] mb-4 line-clamp-3">{r.description}</p>}

                    {/* Specialism badges */}
                    {r.services_offered?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {r.services_offered.slice(0, 5).map((s: string) => (
                          <span key={s} className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201, 169, 110, 0.25)' }}>{s}</span>
                        ))}
                        {r.services_offered.length > 5 && <span className="text-[10px] text-muted">+{r.services_offered.length - 5} more</span>}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted mb-4">
                      {r.travel_availability && (
                        <span className="flex items-center gap-1"><MapPin size={12} />{r.travel_availability === 'worldwide' ? 'Worldwide' : r.travel_availability === 'uk_only' ? 'UK' : r.travel_availability === 'uk_and_europe' ? 'UK & Europe' : r.travel_availability.replace('_', ' ')}</span>
                      )}
                      {r.availability_start && <span className="flex items-center gap-1"><Clock size={12} />From {new Date(r.availability_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
                      {r.duration && <span className="flex items-center gap-1"><Briefcase size={12} />{r.duration}</span>}
                    </div>

                    {/* Product houses */}
                    {r.product_houses?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {r.product_houses.slice(0, 4).map((b: string) => <span key={b} className="text-[10px] font-medium bg-surface text-muted px-2 py-0.5 rounded-full">{b}</span>)}
                      </div>
                    )}

                    {/* Rate + CTA row */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-[13px]">
                        {r.day_rate && <span className="font-medium text-ink">From £{r.day_rate}/day</span>}
                        {r.weekly_rate && <span className="text-muted ml-2">· £{r.weekly_rate}/week</span>}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/residency/${r.id}`} className="text-[12px] font-medium text-muted hover:text-ink flex items-center gap-1 transition-colors">View Profile <ArrowRight size={12} /></Link>
                        <button type="button" onClick={() => setShowEnquiry(r)} className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: '#C9A96E' }}>Enquire</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Enquiry modal */}
      {showEnquiry && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowEnquiry(null)}>
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-medium text-ink">Enquire — {showEnquiry.title}</h3><button type="button" onClick={() => setShowEnquiry(null)} className="text-muted hover:text-ink"><X size={18} /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase.from('messages').insert({ sender_id: user.id, receiver_id: showEnquiry.user_id, content: `Residency enquiry from ${fd.get('name')} (${fd.get('property')}): ${fd.get('message')}`, read: false })
              }
              setShowEnquiry(null)
            }} className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Your Name</label><input name="name" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Property</label><input name="property" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Message</label><textarea name="message" rows={3} required className="input-field" placeholder="Tell us about your property and what you're looking for..." /></div>
              <button type="submit" className="btn-primary w-full">Send Enquiry</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
