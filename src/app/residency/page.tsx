'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Clock, MapPin, X, Star } from 'lucide-react'

const photos = [
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&auto=format&fit=crop', // spa relaxation
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80&auto=format&fit=crop', // spa pool
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&auto=format&fit=crop', // massage therapy
  'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&auto=format&fit=crop', // luxury interior
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80&auto=format&fit=crop', // essential oils
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80&auto=format&fit=crop', // treatment room
]

export default function ResidencyPage() {
  const supabase = createClient()
  const [residencies, setResidencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnquiry, setShowEnquiry] = useState<any>(null)

  useEffect(() => {
    supabase.from('residency_profiles').select('*')
      .or('approval_status.eq.approved,approval_status.is.null')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setResidencies(data || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="text-[36px] md:text-[44px] font-medium text-ink tracking-tight leading-[1.1] mb-3">Spa Residencies</h1>
          <p className="text-[15px] text-secondary max-w-xl mb-8">Invite world-class spa professionals to your property for a fixed residency. From a weekend wellness retreat to a full season — curated talent, extraordinary experiences.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/residency/create" className="btn-primary">List Your Residency</Link>
            <a href="#listings" className="btn-secondary">Find a Resident</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-center gap-8 text-center">
          {[{ n: '1–6', l: 'Month Placements' }, { n: 'UK & Europe', l: 'Locations' }, { n: '5-Star', l: 'Properties' }].map(s => (
            <div key={s.l}><p className="text-[18px] font-semibold text-ink">{s.n}</p><p className="text-[11px] text-muted">{s.l}</p></div>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[14px] font-medium text-ink">{residencies.length} residenc{residencies.length !== 1 ? 'ies' : 'y'} available</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="skeleton h-80 rounded-xl" />)}</div>
        ) : residencies.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-16 text-center">
            <p className="text-[15px] font-medium text-ink mb-2">No residencies available yet</p>
            <p className="text-[13px] text-muted mb-6">Be the first to list your residency availability.</p>
            <Link href="/residency/create" className="btn-primary inline-block">Create a Listing</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {residencies.map((r, i) => (
              <div key={r.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all ${r.is_featured ? 'border-accent ring-1 ring-accent/20' : 'border-border'}`}>
                {/* Image */}
                <div className="h-40 relative overflow-hidden bg-surface">
                  <img src={r.photo_url || r.photos?.[0] || photos[i % photos.length]} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {r.is_featured && <span className="absolute top-3 right-3 text-[9px] font-semibold bg-accent text-white px-2.5 py-1 rounded-full">⭐ Featured</span>}
                  {(r.duration || r.min_duration) && <span className="absolute bottom-3 left-3 text-[10px] font-medium bg-white/90 text-ink px-2.5 py-1 rounded-full">{r.duration || r.min_duration}</span>}
                </div>

                <div className="p-5">
                  <h3 className="text-[17px] font-medium text-ink mb-1.5 leading-snug">{r.title}</h3>
                  {r.description && <p className="text-[13px] text-secondary leading-relaxed mb-3 line-clamp-2">{r.description}</p>}

                  <div className="flex items-center gap-3 text-[12px] text-muted mb-3">
                    {r.travel_availability && <span className="flex items-center gap-1"><MapPin size={11} />{r.travel_availability === 'worldwide' ? 'Worldwide' : r.travel_availability === 'uk_only' ? 'UK' : r.travel_availability.replace('_', ' ')}</span>}
                    {r.availability_start && <span className="flex items-center gap-1"><Clock size={11} />From {new Date(r.availability_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
                  </div>

                  {/* Services */}
                  {r.services_offered?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {r.services_offered.slice(0, 4).map((s: string) => <span key={s} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}

                  {/* Brands */}
                  {r.product_houses?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {r.product_houses.slice(0, 3).map((b: string) => <span key={b} className="text-[10px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}
                    </div>
                  )}

                  {/* Rates */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {r.day_rate && <span className="text-[12px] text-ink bg-surface px-2.5 py-1 rounded-lg font-medium">£{r.day_rate}/day</span>}
                    {r.weekly_rate && <span className="text-[12px] text-ink bg-surface px-2.5 py-1 rounded-lg font-medium">£{r.weekly_rate}/week</span>}
                    {r.monthly_rate && <span className="text-[12px] text-ink bg-surface px-2.5 py-1 rounded-lg font-medium">£{r.monthly_rate}/month</span>}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowEnquiry(r)} className="btn-primary flex-1 text-[12px]">Express Interest</button>
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
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-medium text-ink">Express Interest — {showEnquiry.title}</h3><button type="button" onClick={() => setShowEnquiry(null)} className="text-muted hover:text-ink"><X size={18} /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase.from('messages').insert({ sender_id: user.id, receiver_id: showEnquiry.user_id, content: `Residency interest from ${fd.get('name')} (${fd.get('property')}): ${fd.get('message')}`, read: false })
              }
              setShowEnquiry(null)
            }} className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Your Name</label><input name="name" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Property</label><input name="property" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Message</label><textarea name="message" rows={3} required className="input-field" placeholder="Tell us about your property and what you're looking for..." /></div>
              <button type="submit" className="btn-primary w-full">Send</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
