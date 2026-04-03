'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, MapPin, Clock, X, Star } from 'lucide-react'

const RADIUS_OPTIONS = ['5', '10', '20', '50', 'No limit']
const AVAILABILITY_LABELS: Record<string, string> = {
  immediately: 'Immediately', '1_week': '1 Week', '2_weeks': '2 Weeks', '1_month': '1 Month',
}

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('No limit')
  const [serviceFilter, setServiceFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [showBooking, setShowBooking] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingType, setBookingType] = useState('Day')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('candidate_profiles')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('review_score', { ascending: false })
        .order('created_at', { ascending: false })
      setCandidates(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates.filter((c) => {
    // Only show approved profiles
    if (c.approval_status && c.approval_status !== 'approved') return false
    // Service/specialism filter
    if (serviceFilter && !(c.specialisms || []).some((s: string) => s.toLowerCase().includes(serviceFilter.toLowerCase()))) return false
    // Product house filter
    if (productFilter && !(c.product_houses || []).some((p: string) => p.toLowerCase().includes(productFilter.toLowerCase()))) return false
    // Availability filter
    if (availabilityFilter && c.availability_status !== availabilityFilter) return false
    return true
  })

  // Sort: featured first, then by review score
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (b.review_score || 0) - (a.review_score || 0)
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[50vh]">
          <div className="flex items-center px-6 sm:px-12 lg:px-16 xl:px-24 py-16">
            <div className="max-w-lg">
              <p className="text-neutral-400 text-xs tracking-widest uppercase mb-4">Agency Marketplace</p>
              <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight leading-[1.05] mb-6">Find exceptional talent</h1>
              <p className="text-neutral-400 text-lg font-light leading-relaxed">Browse verified wellness professionals available for shifts, contracts and placements.</p>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=80&auto=format&fit=crop" alt="Wellness spa" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-6 bg-white border-y border-neutral-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Postcode + Radius */}
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Postcode</label>
              <input type="text" placeholder="e.g. SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="input-field !py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Radius</label>
              <select value={radius} onChange={(e) => setRadius(e.target.value)} className="input-field !py-2 text-sm">
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r === 'No limit' ? 'No limit' : `${r} miles`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Service</label>
              <input type="text" placeholder="e.g. Massage" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="input-field !py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Product House</label>
              <input type="text" placeholder="e.g. ESPA" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="input-field !py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Availability</label>
              <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="input-field !py-2 text-sm">
                <option value="">Any</option>
                <option value="immediately">Immediately</option>
                <option value="1_week">1 Week</option>
                <option value="2_weeks">2 Weeks</option>
                <option value="1_month">1 Month</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-300 mt-2">{sorted.length} practitioner{sorted.length !== 1 ? 's' : ''} found</p>
        </div>
      </section>

      {/* Results */}
      <section className="py-10 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">&#128100;</p>
              <h3 className="text-2xl font-bold text-black mb-2">No practitioners found</h3>
              <p className="text-neutral-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {sorted.map((c) => (
                <div key={c.id} className="bg-white border border-neutral-200 hover:border-neutral-400 transition-colors relative">
                  {c.is_featured && (
                    <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-semibold px-2 py-0.5 tracking-wider uppercase">Featured</div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-14 h-14 bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {c.profile_image_url || c.avatar_url ? (
                          <img src={c.profile_image_url || c.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-xl text-neutral-300">{c.full_name?.[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-black truncate">{c.full_name}</h3>
                          {c.availability_status === 'immediately' && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-neutral-400 truncate">{c.headline || c.role_level || 'Wellness Professional'}</p>
                        {c.review_score > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star size={12} className="text-amber-400" fill="currentColor" />
                            <span className="text-xs text-neutral-500">{c.review_score} ({c.review_count})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {c.location && <p className="text-neutral-400 text-xs flex items-center space-x-1 mb-3"><MapPin size={12} /><span>{c.location}</span></p>}

                    {c.day_rate_min && <p className="text-sm font-medium text-black mb-3">£{c.day_rate_min}{c.day_rate_max ? `–£${c.day_rate_max}` : ''} /day</p>}

                    {c.specialisms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.specialisms.slice(0, 4).map((s: string) => (
                          <span key={s} className="text-xs border border-neutral-200 text-neutral-500 px-2 py-0.5">{s}</span>
                        ))}
                        {c.specialisms.length > 4 && <span className="text-xs text-neutral-300">+{c.specialisms.length - 4}</span>}
                      </div>
                    )}

                    {c.availability_status && (
                      <p className="text-xs text-neutral-300 flex items-center space-x-1 mb-4">
                        <Clock size={12} /><span>Available: {AVAILABILITY_LABELS[c.availability_status] || c.availability_status}</span>
                      </p>
                    )}

                    <button onClick={() => setShowBooking(c)} className="btn-primary w-full text-sm !py-2.5">Request Booking</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowBooking(null)}>
          <div className="bg-white w-full sm:max-w-md sm:mx-4 p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Request Booking</h3>
              <button onClick={() => setShowBooking(null)} className="text-neutral-300 hover:text-black"><X size={20} /></button>
            </div>
            <div className="flex items-center space-x-3 mb-6 p-4 bg-neutral-50">
              <div className="w-10 h-10 bg-neutral-200 flex items-center justify-center"><span className="font-bold text-neutral-400">{showBooking.full_name?.[0]}</span></div>
              <div><p className="font-medium text-black text-sm">{showBooking.full_name}</p><p className="text-xs text-neutral-400">{showBooking.headline || showBooking.role_level || 'Wellness Professional'}</p></div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Shift Date</label><input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="input-field" /></div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Shift Type</label>
                <div className="flex gap-2">{['Morning', 'Day', 'Evening', 'Full Day'].map((t) => (
                  <button key={t} onClick={() => setBookingType(t)} className={`px-4 py-2 text-xs font-medium transition-colors ${bookingType === t ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>{t}</button>
                ))}</div>
              </div>
              <button onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && bookingDate) {
                  await supabase.from('agency_bookings').insert({ candidate_id: showBooking.id, employer_id: user.id, shift_date: bookingDate, shift_type: bookingType, status: 'pending' })
                }
                setShowBooking(null); setBookingDate('')
              }} className="btn-primary w-full">Send Request</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
