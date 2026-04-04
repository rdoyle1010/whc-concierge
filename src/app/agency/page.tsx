'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Shield, ChevronDown, X } from 'lucide-react'

const SERVICE_FILTERS = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','ESPA Facial','Elemis Facial','Dermalogica Facial','Body Wraps','Reflexology','Reiki','Prenatal Massage','Sports Massage','Laser','Injectables','Lashes','Nails','Waxing']
const BRAND_FILTERS = ['ESPA','Elemis','Dermalogica','Comfort Zone','Aromatherapy Associates','Bamford','Sodashi','Thalgo','Germaine de Capuccini','Decleor','La Mer']
const ROLE_FILTERS = ['Apprentice','Therapist','Senior Therapist','Lead Therapist','Spa Manager','Receptionist']

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2">
        <span className="text-[13px] font-medium text-ink">{title}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  )
}

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('UK-wide')
  const [services, setServices] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [insuredOnly, setInsuredOnly] = useState(false)
  const [availNow, setAvailNow] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [showEnquiry, setShowEnquiry] = useState<any>(null)
  const [visible, setVisible] = useState(12)

  useEffect(() => {
    supabase.from('candidate_profiles').select('*')
      .eq('approval_status', 'approved')
      .order('is_featured', { ascending: false })
      .order('review_score', { ascending: false })
      .then(({ data }) => { setCandidates(data || []); setLoading(false) })
  }, [])

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const clearFilters = () => { setServices([]); setBrands([]); setRoles([]); setInsuredOnly(false); setAvailNow(false); setPostcode('') }

  const filtered = candidates.filter(c => {
    if (insuredOnly && !c.has_insurance) return false
    if (availNow && c.availability_status !== 'immediately') return false
    if (services.length > 0 && !services.some(s => (c.services_offered || []).some((sp: string) => sp.toLowerCase().includes(s.toLowerCase())))) return false
    if (brands.length > 0 && !brands.some(b => (c.product_houses || []).some((ph: string) => ph.toLowerCase().includes(b.toLowerCase())))) return false
    if (roles.length > 0 && !roles.includes(c.role_level)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rated') return (b.review_score || 0) - (a.review_score || 0)
    if (sortBy === 'rate_high') return (b.day_rate_max || b.day_rate_min || 0) - (a.day_rate_max || a.day_rate_min || 0)
    if (sortBy === 'rate_low') return (a.day_rate_min || 999) - (b.day_rate_min || 999)
    if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    // Default: featured first, then rating
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (b.review_score || 0) - (a.review_score || 0)
  })

  const pc = (s: string) => s?.split(' ')[0] || s // First part of postcode

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="text-[36px] md:text-[44px] font-medium text-ink tracking-tight leading-[1.1] mb-3">Find Exceptional Spa Talent</h1>
          <p className="text-[15px] text-secondary max-w-xl mb-8">Search our network of verified, insured spa professionals available for agency work, seasonal cover and specialist treatments.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input type="text" placeholder="Enter postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="input-field flex-1" />
            <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field sm:w-40">
              <option>UK-wide</option><option>5 miles</option><option>10 miles</option><option>25 miles</option><option>50 miles</option><option>100 miles</option>
            </select>
            <button type="button" className="btn-primary flex items-center gap-2"><Search size={14} />Search</button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[76px] self-start max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-medium text-ink">Filters</p>
                <button type="button" onClick={clearFilters} className="text-[11px] text-muted hover:text-ink">Clear all</button>
              </div>

              <FilterSection title="Availability" defaultOpen>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={availNow} onChange={() => setAvailNow(!availNow)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">Available Now</span></label>
              </FilterSection>

              <FilterSection title="Services Offered" defaultOpen>
                {SERVICE_FILTERS.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={services.includes(s)} onChange={() => toggleFilter(services, setServices, s)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{s}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Product Houses">
                {BRAND_FILTERS.map(b => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleFilter(brands, setBrands, b)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{b}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Role Level">
                {ROLE_FILTERS.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggleFilter(roles, setRoles, r)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{r}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Insurance">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={insuredOnly} onChange={() => setInsuredOnly(!insuredOnly)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">Insured only</span></label>
              </FilterSection>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] text-muted">{sorted.length} therapist{sorted.length !== 1 ? 's' : ''}</p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]">
                <option value="match">Best Match</option><option value="rated">Highest Rated</option><option value="rate_low">Day Rate ↑</option><option value="rate_high">Day Rate ↓</option><option value="recent">Most Recent</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-72 rounded-xl" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <p className="text-[15px] text-ink font-medium mb-2">No therapists found</p>
                <p className="text-[13px] text-muted">Try widening your radius or adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sorted.slice(0, visible).map(c => (
                    <div key={c.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all ${c.is_featured ? 'border-accent ring-1 ring-accent/20' : 'border-border'}`}>
                      <div className="p-5">
                        {/* Top: photo + badges */}
                        <div className="flex items-start gap-3 mb-3 relative">
                          <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center shrink-0 overflow-hidden">
                            {c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[20px] font-semibold text-accent">{c.full_name?.[0]}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[16px] font-medium text-ink truncate">{c.full_name}</h3>
                            {c.role_level && <span className="inline-block text-[10px] font-medium bg-surface text-secondary px-2 py-0.5 rounded-full mt-0.5">{c.role_level}</span>}
                            {c.headline && <p className="text-[12px] text-muted truncate mt-1">{c.headline}</p>}
                          </div>
                          {c.is_featured && <span className="absolute -top-1 -right-1 text-[9px] font-semibold bg-accent text-white px-2 py-0.5 rounded-full">⭐ Featured</span>}
                        </div>

                        {/* Rating + location */}
                        <div className="flex items-center gap-3 mb-3">
                          {c.review_score > 0 ? (
                            <span className="flex items-center gap-1 text-[12px]"><Star size={11} className="text-amber-400" fill="currentColor" /><span className="text-ink font-medium">{c.review_score}</span><span className="text-muted">({c.review_count})</span></span>
                          ) : <span className="text-[11px] text-muted">New</span>}
                          {c.postcode && <span className="text-[11px] text-muted flex items-center gap-1"><MapPin size={10} />{pc(c.postcode)}</span>}
                          {c.has_insurance && <span className="text-[10px] text-success flex items-center gap-0.5"><Shield size={10} />Insured</span>}
                        </div>

                        {/* Services */}
                        {c.services_offered?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {c.services_offered.slice(0, 4).map((s: string) => <span key={s} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                            {c.services_offered.length > 4 && <span className="text-[10px] text-muted">+{c.services_offered.length - 4}</span>}
                          </div>
                        )}

                        {/* Product houses */}
                        {c.product_houses?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {c.product_houses.slice(0, 3).map((b: string) => <span key={b} className="text-[10px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}
                            {c.product_houses.length > 3 && <span className="text-[10px] text-muted">+{c.product_houses.length - 3}</span>}
                          </div>
                        )}

                        {/* Day rate */}
                        {(c.day_rate_min || c.day_rate_max) && (
                          <p className="text-[14px] font-semibold text-accent mb-2">
                            £{c.day_rate_min || c.day_rate_max}{c.day_rate_max && c.day_rate_min ? ` – £${c.day_rate_max}` : ''} <span className="text-[11px] font-normal text-muted">/ day</span>
                          </p>
                        )}

                        {/* Availability */}
                        <div className="mb-4">
                          {c.availability_status === 'immediately' ? <span className="text-[11px] text-success font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full" />Available Now</span>
                          : c.availability_status === '1_week' || c.availability_status === '2_weeks' ? <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Available Soon</span>
                          : <span className="text-[11px] text-muted flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />Unavailable</span>}
                        </div>

                        {/* CTAs */}
                        <div className="flex gap-2">
                          <Link href={`/agency/${c.id}`} className="btn-secondary flex-1 text-center text-[12px]">View Profile</Link>
                          <button type="button" onClick={() => setShowEnquiry(c)} className="btn-primary flex-1 text-[12px]">Enquire</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {visible < sorted.length && (
                  <div className="text-center mt-8"><button type="button" onClick={() => setVisible(v => v + 12)} className="btn-secondary">Load more therapists</button></div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry modal */}
      {showEnquiry && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowEnquiry(null)}>
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-medium text-ink">Enquire — {showEnquiry.full_name}</h3><button type="button" onClick={() => setShowEnquiry(null)} className="text-muted hover:text-ink"><X size={18} /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase.from('messages').insert({ sender_id: user.id, receiver_id: showEnquiry.user_id || showEnquiry.id, content: `Enquiry from ${fd.get('name')} at ${fd.get('property')}: ${fd.get('message')}`, read: false })
              }
              setShowEnquiry(null)
            }} className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Your Name</label><input name="name" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Property</label><input name="property" required className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Dates Needed</label><input name="dates" className="input-field" placeholder="e.g. 15-20 June" /></div>
              <div><label className="eyebrow block mb-1.5">Message</label><textarea name="message" rows={3} required className="input-field" /></div>
              <button type="submit" className="btn-primary w-full">Send Enquiry</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
