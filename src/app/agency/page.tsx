'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, MapPin, Clock, X, Star } from 'lucide-react'

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [showBooking, setShowBooking] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingType, setBookingType] = useState('Day')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('candidate_profiles').select('*').order('created_at', { ascending: false })
      setCandidates(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates.filter((c) => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase()) && !c.headline?.toLowerCase().includes(search.toLowerCase())) return false
    if (specFilter && !(c.specialisms || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
          <div className="flex items-center px-6 sm:px-12 lg:px-16 xl:px-24 py-20">
            <div className="max-w-lg">
              <p className="text-neutral-400 text-xs tracking-widest uppercase mb-4">Agency Marketplace</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[1.05] mb-6">Find exceptional talent</h1>
              <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">Browse verified wellness professionals available for shifts, contracts and placements.</p>
              <Link href="/register/employer" className="btn-primary inline-block">Post Agency Shifts</Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=80&auto=format&fit=crop" alt="Wellness spa" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-y border-neutral-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
            <input type="text" placeholder="Search by name or skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
          </div>
          <input type="text" placeholder="Filter by specialism..." value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className="input-field md:w-64" />
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">&#128100;</p>
              <h3 className="text-2xl font-bold text-black mb-2">No professionals found</h3>
              <p className="text-neutral-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {filtered.map((c) => (
                <div key={c.id} className="bg-white border border-neutral-200 hover:border-neutral-400 transition-colors">
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
                          <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" title="Available" />
                        </div>
                        <p className="text-sm text-neutral-400 truncate">{c.headline || 'Wellness Professional'}</p>
                      </div>
                    </div>

                    {c.location && <p className="text-neutral-400 text-xs flex items-center space-x-1 mb-3"><MapPin size={12} /><span>{c.location}</span></p>}

                    {c.specialisms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.specialisms.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs border border-neutral-200 text-neutral-500 px-2.5 py-1">{s}</span>
                        ))}
                        {c.specialisms.length > 3 && <span className="text-xs text-neutral-300">+{c.specialisms.length - 3}</span>}
                      </div>
                    )}

                    {c.experience_years && <p className="text-xs text-neutral-300 flex items-center space-x-1 mb-4"><Clock size={12} /><span>{c.experience_years} years experience</span></p>}

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
              <div><p className="font-medium text-black text-sm">{showBooking.full_name}</p><p className="text-xs text-neutral-400">{showBooking.headline || 'Wellness Professional'}</p></div>
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
