'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, MapPin, Star, Clock, X } from 'lucide-react'

const AVAIL: Record<string,string> = { immediately:'Available now', '1_week':'1 week', '2_weeks':'2 weeks', '1_month':'1 month' }

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('No limit')
  const [service, setService] = useState('')
  const [product, setProduct] = useState('')
  const [avail, setAvail] = useState('')
  const [showBooking, setShowBooking] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingType, setBookingType] = useState('Day')

  useEffect(() => { supabase.from('candidate_profiles').select('*').order('is_featured',{ascending:false}).order('review_score',{ascending:false}).then(({data})=>{setCandidates(data||[]);setLoading(false)}) }, [])

  const filtered = candidates.filter(c => {
    if (c.approval_status && c.approval_status !== 'approved' && c.approval_status !== 'pending') return false
    if (service && !(c.specialisms||[]).some((s:string)=>s.toLowerCase().includes(service.toLowerCase()))) return false
    if (product && !(c.product_houses||[]).some((p:string)=>p.toLowerCase().includes(product.toLowerCase()))) return false
    if (avail && c.availability_status !== avail) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="eyebrow mb-3">Agency marketplace</p>
          <h1 className="text-[44px] md:text-[52px] font-medium text-ink leading-[1.1] tracking-tight mb-4">Book verified professionals.<br />Directly.</h1>
          <p className="text-secondary max-w-lg">No middlemen, no agency fees. Find the right person for your shift and book them instantly.</p>
        </div>
      </section>

      {/* Search */}
      <section className="border-y border-border sticky top-[60px] z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label className="eyebrow block mb-1">Postcode</label><input type="text" placeholder="SW1A 1AA" value={postcode} onChange={e=>setPostcode(e.target.value)} className="input-field !py-2 text-[13px]" /></div>
            <div><label className="eyebrow block mb-1">Radius</label><select value={radius} onChange={e=>setRadius(e.target.value)} className="input-field !py-2 text-[13px]"><option>No limit</option><option>5 miles</option><option>10 miles</option><option>20 miles</option><option>50 miles</option></select></div>
            <div><label className="eyebrow block mb-1">Service</label><input type="text" placeholder="e.g. Massage" value={service} onChange={e=>setService(e.target.value)} className="input-field !py-2 text-[13px]" /></div>
            <div><label className="eyebrow block mb-1">Product house</label><input type="text" placeholder="e.g. ESPA" value={product} onChange={e=>setProduct(e.target.value)} className="input-field !py-2 text-[13px]" /></div>
            <div><label className="eyebrow block mb-1">Availability</label><select value={avail} onChange={e=>setAvail(e.target.value)} className="input-field !py-2 text-[13px]"><option value="">Any</option><option value="immediately">Immediately</option><option value="1_week">1 week</option><option value="2_weeks">2 weeks</option></select></div>
          </div>
          <p className="text-[11px] text-muted mt-2">{filtered.length} practitioner{filtered.length!==1?'s':''}</p>
        </div>
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full"/></div>
          : filtered.length===0 ? <div className="text-center py-20"><p className="text-[14px] text-muted">No practitioners found. Try adjusting your filters.</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
              {filtered.map(c => (
                <div key={c.id} className="card-hover relative">
                  {c.is_featured && <span className="absolute top-3 right-3 text-[9px] font-semibold bg-surface border border-border px-2 py-0.5 rounded-full text-muted uppercase tracking-wider">Featured</span>}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 bg-surface border border-border rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                      {c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover"/> : <span className="text-[14px] font-semibold text-muted">{c.full_name?.[0]}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-medium text-ink truncate">{c.full_name}</h3>
                        {c.availability_status==='immediately' && <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"/>}
                      </div>
                      <p className="text-[12px] text-muted truncate">{c.headline||c.role_level||'Wellness Professional'}</p>
                    </div>
                  </div>
                  {c.review_score>0 && <div className="flex items-center gap-1 mb-2"><Star size={11} className="text-amber-400" fill="currentColor"/><span className="text-[11px] text-muted">{c.review_score} ({c.review_count})</span></div>}
                  {c.location && <p className="text-[12px] text-muted flex items-center gap-1 mb-2"><MapPin size={11}/>{c.location}</p>}
                  {c.day_rate_min && <p className="text-[13px] font-medium text-ink mb-2">£{c.day_rate_min}{c.day_rate_max?`–£${c.day_rate_max}`:''} /day</p>}
                  {c.specialisms?.length>0 && <div className="flex flex-wrap gap-1 mb-3">{c.specialisms.slice(0,4).map((s:string)=><span key={s} className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{s}</span>)}{c.specialisms.length>4&&<span className="text-[10px] text-muted">+{c.specialisms.length-4}</span>}</div>}
                  {c.availability_status && <p className="text-[11px] text-muted flex items-center gap-1 mb-4"><Clock size={11}/>{AVAIL[c.availability_status]||c.availability_status}</p>}
                  <button onClick={()=>setShowBooking(c)} className="btn-primary w-full text-[12px]">Request booking</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={()=>setShowBooking(null)}>
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 animate-fade-in-up" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-medium text-ink">Request booking</h3><button onClick={()=>setShowBooking(null)} className="text-muted hover:text-ink"><X size={18}/></button></div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-surface rounded-lg">
              <div className="w-9 h-9 bg-white border border-border rounded-full flex items-center justify-center text-[12px] font-semibold text-muted">{showBooking.full_name?.[0]}</div>
              <div><p className="text-[13px] font-medium text-ink">{showBooking.full_name}</p><p className="text-[11px] text-muted">{showBooking.role_level||'Wellness Professional'}</p></div>
            </div>
            <div className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Shift date</label><input type="date" value={bookingDate} onChange={e=>setBookingDate(e.target.value)} className="input-field"/></div>
              <div><label className="eyebrow block mb-1.5">Shift type</label><div className="flex gap-2">{['Morning','Day','Evening','Full Day'].map(t=><button key={t} onClick={()=>setBookingType(t)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${bookingType===t?'bg-ink text-white':'bg-surface text-muted border border-border'}`}>{t}</button>)}</div></div>
              <button onClick={async()=>{const{data:{user}}=await supabase.auth.getUser();if(user&&bookingDate){await supabase.from('agency_bookings').insert({candidate_id:showBooking.id,employer_id:user.id,shift_date:bookingDate,shift_type:bookingType,status:'pending'})}setShowBooking(null);setBookingDate('')}} className="btn-primary w-full">Send request</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
