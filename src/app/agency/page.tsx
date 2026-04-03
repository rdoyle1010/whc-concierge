'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Filter, Calendar, X } from 'lucide-react'

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
      const { data } = await supabase
        .from('candidate_profiles')
        .select('*')
        .order('created_at', { ascending: false })
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
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Agency Marketplace</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
            Find <span className="italic gradient-text-gold">Exceptional</span> Talent
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-lg font-light">Browse verified wellness professionals available for shifts, contracts and placements.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-gray-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search by name or specialism..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-12" />
            </div>
            <input type="text" placeholder="Filter by specialism..." value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className="input-field md:w-64" />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-2 border-gold border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                <Star size={32} className="text-gold/40" />
              </div>
              <h3 className="font-serif text-2xl text-ink mb-2">No Professionals Found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {filtered.map((c) => (
                <div key={c.id} className="card group p-0 overflow-hidden">
                  {/* Card header */}
                  <div className="h-20 bg-gradient-to-r from-ink to-navy-light relative">
                    <div className="absolute -bottom-8 left-6">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                        {c.profile_image_url || c.avatar_url ? (
                          <img src={c.profile_image_url || c.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src={`https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80&fit=crop`} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                    {/* Availability dot */}
                    <div className="absolute top-4 right-4 flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white/50 text-xs">Available</span>
                    </div>
                  </div>

                  <div className="p-6 pt-12">
                    <h3 className="font-serif text-lg font-semibold text-ink">{c.full_name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{c.headline || 'Wellness Professional'}</p>

                    {c.location && (
                      <p className="text-gray-400 text-xs flex items-center space-x-1 mb-3">
                        <MapPin size={12} /><span>{c.location}</span>
                      </p>
                    )}

                    {c.specialisms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.specialisms.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full">{s}</span>
                        ))}
                        {c.specialisms.length > 3 && <span className="text-xs text-gray-300">+{c.specialisms.length - 3}</span>}
                      </div>
                    )}

                    {c.experience_years && (
                      <p className="text-xs text-gray-300 flex items-center space-x-1 mb-4">
                        <Clock size={12} /><span>{c.experience_years} years experience</span>
                      </p>
                    )}

                    <button onClick={() => setShowBooking(c)} className="btn-primary w-full text-sm !py-2.5">
                      Request Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBooking(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-ink">Request Booking</h3>
              <button onClick={() => setShowBooking(null)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
            </div>

            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <span className="font-serif font-bold text-gold text-lg">{showBooking.full_name?.[0]}</span>
              </div>
              <div>
                <p className="font-medium text-ink">{showBooking.full_name}</p>
                <p className="text-sm text-gray-400">{showBooking.headline || 'Wellness Professional'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shift Date</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shift Type</label>
                <div className="flex gap-2">
                  {['Morning', 'Day', 'Evening', 'Full Day'].map((t) => (
                    <button key={t} onClick={() => setBookingType(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${bookingType === t ? 'bg-gold text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <button onClick={async () => {
                // Save booking to agency_bookings table
                const { data: { user } } = await supabase.auth.getUser()
                if (user && bookingDate) {
                  await supabase.from('agency_bookings').insert({
                    candidate_id: showBooking.id,
                    employer_id: user.id,
                    shift_date: bookingDate,
                    shift_type: bookingType,
                    status: 'pending',
                  })
                }
                setShowBooking(null)
                setBookingDate('')
                alert('Booking request sent!')
              }} className="btn-primary w-full mt-2">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
