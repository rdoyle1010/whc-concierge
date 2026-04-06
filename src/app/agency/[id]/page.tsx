'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { MapPin, Star, Shield, Clock, Check, ArrowLeft } from 'lucide-react'
import ReviewBreakdown from '@/components/ReviewBreakdown'

export default function AgencyProfilePage() {
  const { id } = useParams()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enquirySent, setEnquirySent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('candidate_profiles').select('*').eq('id', id).single()
      setProfile(data)
      if (data) {
        const { data: revs } = await supabase.from('reviews').select('*').eq('reviewed_id', data.user_id || data.id).order('created_at', { ascending: false }).limit(10)
        setReviews(revs || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen bg-white"><Navbar /><div className="pt-20 max-w-4xl mx-auto px-6"><div className="skeleton h-48 rounded-xl mb-6" /><div className="skeleton h-8 w-1/3 mb-3" /><div className="skeleton h-4 w-1/2 mb-6" /><div className="skeleton h-32" /></div></div>
  if (!profile) return <div className="min-h-screen bg-white"><Navbar /><div className="pt-20 max-w-4xl mx-auto px-6 text-center py-24"><p className="text-muted">Profile not found.</p><Link href="/agency" className="btn-primary inline-block mt-4">Back to Agency</Link></div></div>

  const pc = profile.postcode?.split(' ')[0] || profile.location || ''

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-16 max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <Link href="/agency" className="text-[13px] text-muted hover:text-ink flex items-center gap-1 mb-6"><ArrowLeft size={14} />Back to Agency</Link>

        {/* Hero card */}
        <div className="bg-white border border-border rounded-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-ink flex items-center justify-center shrink-0 overflow-hidden">
              {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-[32px] font-semibold text-accent">{profile.full_name?.[0]}</span>}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-[28px] font-medium text-ink">{profile.full_name}</h1>
                {profile.role_level && <span className="text-[11px] font-medium bg-surface text-secondary px-3 py-1 rounded-full">{profile.role_level}</span>}
              </div>
              {profile.headline && <p className="text-[14px] text-secondary mb-3">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-4 text-[13px]">
                {profile.review_score > 0 && <span className="flex items-center gap-1"><Star size={13} className="text-amber-400" fill="currentColor" /><span className="font-medium text-ink">{profile.review_score}</span><span className="text-muted">({profile.review_count} reviews)</span></span>}
                {pc && <span className="flex items-center gap-1 text-muted"><MapPin size={13} />{pc}</span>}
                {profile.has_insurance && <span className="flex items-center gap-1 text-success"><Shield size={13} />Insured</span>}
                {profile.availability_status === 'immediately' && <span className="flex items-center gap-1 text-success"><span className="w-2 h-2 bg-success rounded-full" />Available Now</span>}
              </div>
            </div>
            <div className="shrink-0">
              {(profile.day_rate_min || profile.day_rate_max) && <p className="text-[20px] font-semibold text-accent mb-1">£{profile.day_rate_min}{profile.day_rate_max ? `–£${profile.day_rate_max}` : ''}<span className="text-[12px] font-normal text-muted"> /day</span></p>}
              <a href="#enquire" className="btn-primary block text-center mt-2">Enquire Now</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">About</h2>
                <p className="text-[14px] text-secondary leading-[1.8] whitespace-pre-wrap">{profile.bio}</p>
                {profile.experience_years && <p className="text-[13px] text-muted mt-3">{profile.experience_years} years experience</p>}
              </div>
            )}

            {/* Services */}
            {profile.services_offered?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Services Offered</h2>
                <div className="flex flex-wrap gap-2">{profile.services_offered.map((s: string) => <span key={s} className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>)}</div>
              </div>
            )}

            {/* Product houses */}
            {profile.product_houses?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Product House Experience</h2>
                <div className="flex flex-wrap gap-2">{profile.product_houses.map((b: string) => <span key={b} className="text-[11px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2.5 py-1 rounded-full">{b}</span>)}</div>
              </div>
            )}

            {/* Qualifications */}
            {profile.qualifications?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Qualifications</h2>
                <div className="space-y-1.5">{profile.qualifications.map((q: string) => <div key={q} className="flex items-center gap-2 text-[13px] text-secondary"><Check size={13} className="text-success" />{q}</div>)}</div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-4">Reviews</h2>
                <div className="space-y-4">{reviews.map(r => (
                  <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < Math.round(r.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}
                        <span className="text-[12px] font-medium text-ink ml-1">{r.rating}</span>
                      </div>
                      <p className="text-[11px] text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.criteria_scores && <div className="my-2"><ReviewBreakdown criteriaScores={r.criteria_scores} /></div>}
                    {r.comment && <p className="text-[13px] text-secondary">{r.comment}</p>}
                  </div>
                ))}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-medium text-ink mb-3">Availability</h3>
              <p className="text-[13px] text-secondary mb-2">{profile.availability_status === 'immediately' ? 'Available immediately' : profile.availability_status?.replace('_', ' ') || 'Contact for availability'}</p>
              <p className="text-[13px] text-secondary">Travel: {profile.travel_availability === 'worldwide' ? 'Worldwide' : profile.travel_availability === 'europe' ? 'Europe' : profile.travel_availability === 'radius' ? `Within ${profile.travel_radius_miles || '?'} miles` : 'UK only'}</p>
              {profile.has_car && <p className="text-[12px] text-muted mt-2">Has own transport</p>}
            </div>

            {/* Enquire form */}
            <div id="enquire" className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-medium text-ink mb-4">Send an Enquiry</h3>
              {enquirySent ? (
                <div className="text-center py-4"><Check size={20} className="mx-auto text-success mb-2" /><p className="text-[13px] text-ink">Enquiry sent!</p></div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: profile.user_id || profile.id, content: `Enquiry from ${fd.get('name')} (${fd.get('property')}): ${fd.get('message')}`, read: false })
                  }
                  setEnquirySent(true)
                }} className="space-y-3">
                  <input name="name" required placeholder="Your name" className="input-field text-[13px]" />
                  <input name="property" required placeholder="Property name" className="input-field text-[13px]" />
                  <input name="dates" placeholder="Dates needed" className="input-field text-[13px]" />
                  <textarea name="message" rows={3} required placeholder="Your message..." className="input-field text-[13px]" />
                  <button type="submit" className="btn-primary w-full text-[12px]">Send Enquiry</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
