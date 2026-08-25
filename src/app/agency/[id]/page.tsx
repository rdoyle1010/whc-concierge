'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import { MapPin, Star, Shield, Clock, Check, ArrowLeft, X, GraduationCap } from 'lucide-react'
import { courseTitle, ACADEMY } from '@/lib/academy'
import ReviewBreakdown from '@/components/ReviewBreakdown'
import ReviewForm from '@/components/ReviewForm'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import { shiftHours } from '@/lib/agency-time'

export default function AgencyProfilePage() {
  const { id } = useParams()
  const profileId = Array.isArray(id) ? id[0] : (id as string)
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmployer, setIsEmployer] = useState(false)
  const [offer, setOffer] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [offerBusy, setOfferBusy] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [offerRate, setOfferRate] = useState('')
  const [offerStartTime, setOfferStartTime] = useState('09:00')
  const [offerEndTime, setOfferEndTime] = useState('17:00')
  const [academyBadges, setAcademyBadges] = useState<{ course_slug: string; completed_at: string }[]>([])
  const [suggestSlug, setSuggestSlug] = useState('')
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [suggestNotice, setSuggestNotice] = useState('')

  const previewRate = parseInt(offerRate, 10) || 0
  const previewHours = shiftHours(offerStartTime, offerEndTime) || 0
  const previewSubtotal = previewRate * previewHours
  const previewFee = Math.ceil(previewSubtotal * AGENCY_PLATFORM_FEE_PCT)
  const previewTotal = previewSubtotal + previewFee

  useEffect(() => {
    async function load() {
      const directoryRes = await fetch(`/api/agency/directory?id=${encodeURIComponent(profileId)}`)
      const directoryJson = directoryRes.ok ? await directoryRes.json() : null
      const data = directoryJson?.candidate || null
      setProfile(data)
      if (data?.hourly_rate) setOfferRate(String(data.hourly_rate))
      if (data) {
        const { data: revs } = await supabase.from('reviews').select('*').eq('reviewee_id', data.user_id || data.id).order('created_at', { ascending: false }).limit(100)
        setReviews(revs || [])
        const { data: courses } = await supabase.from('course_enrollments')
          .select('course_slug, completed_at').eq('candidate_id', data.id).not('completed_at', 'is', null)
        setAcademyBadges(courses || [])
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: emp } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (emp) {
          setIsEmployer(true)
          try {
            const res = await fetch('/api/agency/booking')
            if (res.ok) {
              const j = await res.json()
              const mine = (j.bookings || []).filter((b: any) => b.candidate_id === profileId && b.viewer_role === 'employer')
              const open = mine.find((b: any) => b.status === 'pending' || b.status === 'countered')
              setOffer(open || null)
              setHistory(mine.filter((b: any) => b.id !== open?.id))
            }
          } catch { }
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function submitOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setOfferError('')
    const fd = new FormData(e.currentTarget)
    setOfferBusy(true)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create', candidateId: profileId,
          rate: offerRate, shiftDate: fd.get('shiftDate'),
          shiftStartTime: offerStartTime, shiftEndTime: offerEndTime,
          shiftType: fd.get('shiftType') || undefined,
          repeatWeeks: fd.get('repeatWeeks') || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) { setOfferError(j.error || 'Could not send the offer - please try again.'); return }
      setOffer(j.booking)
    } catch {
      setOfferError('Could not send the offer - please try again.')
    } finally {
      setOfferBusy(false)
    }
  }

  async function actOnOffer(action: 'accept' | 'decline') {
    if (!offer) return
    setOfferError('')
    setOfferBusy(true)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingId: offer.id }),
      })
      const j = await res.json()
      if (!res.ok) { setOfferError(j.error || 'Something went wrong - please try again.'); return }
      setOffer(null)
      setHistory((h) => [j.booking, ...h])
    } catch {
      setOfferError('Something went wrong - please try again.')
    } finally {
      setOfferBusy(false)
    }
  }

  if (loading) return <DashboardShell role="employer"><div className="max-w-6xl mx-auto"><div className="skeleton h-48 rounded-2xl mb-6" /><div className="skeleton h-8 w-1/3 mb-3" /><div className="skeleton h-4 w-1/2 mb-6" /><div className="skeleton h-32" /></div></DashboardShell>
  if (!profile) return <DashboardShell role="employer"><div className="max-w-6xl mx-auto text-center py-24"><p className="text-muted">Profile not found.</p><Link href="/agency" className="btn-primary inline-block mt-4">Back to Agency</Link></div></DashboardShell>

  const pc = profile.postcode?.split(' ')[0] || profile.location || ''

  return (
    <DashboardShell role="employer">
      <div className="max-w-6xl mx-auto pb-10">
        <p className="dashboard-eyebrow mb-2">Agency professional</p>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href="/agency" className="btn-secondary inline-flex items-center gap-1.5 text-[12px]"><ArrowLeft size={14} />Browse Agency</Link>
          <Link href="/employer/agency" className="btn-secondary inline-flex items-center gap-1.5 text-[12px]"><Clock size={14} />Agency Bookings</Link>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-full bg-[#F1EBDD] border border-[#E2D8C5] flex items-center justify-center shrink-0 overflow-hidden">
              {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-[32px] font-semibold text-[#12344D]">{profile.full_name?.[0]}</span>}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-[32px] md:text-[38px] font-semibold tracking-tight text-ink capitalize">{profile.full_name}</h1>
                {profile.role_level && <span className="text-[11px] font-medium bg-surface text-secondary px-3 py-1 rounded-full">{profile.role_level}</span>}
              </div>
              {profile.headline && <p className="text-[14px] text-secondary mb-3">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-4 text-[13px]">
                {profile.review_score > 0 && <span className="flex items-center gap-1"><Star size={13} className="text-amber-400" fill="currentColor" /><span className="font-medium text-ink">{profile.review_score}</span><span className="text-muted">({profile.review_count} reviews)</span></span>}
                {pc && <span className="flex items-center gap-1 text-muted"><MapPin size={13} />{pc}</span>}
                {profile.whc_verified ? <span className="flex items-center gap-1 font-semibold text-green-700"><Shield size={13} />WHC Verified</span>
                : profile.has_insurance && <span className="flex items-center gap-1 text-success"><Shield size={13} />Insured</span>}
                {profile.availability_status === 'immediately' && <span className="flex items-center gap-1 text-success"><span className="w-2 h-2 bg-success rounded-full" />Available Now</span>}
              </div>
              {academyBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-accent inline-flex items-center gap-1"><GraduationCap size={13} /> WHC Academy:</span>
                  {academyBadges.map(b => (
                    <span key={b.course_slug} className="text-[11px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2.5 py-1 rounded-full">
                      {courseTitle(b.course_slug)}
                    </span>
                  ))}
                </div>
              )}
              {isEmployer && (
                suggestNotice ? (
                  <p className="text-[12px] text-green-700 mt-3">{suggestNotice}</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <select value={suggestSlug} onChange={e => setSuggestSlug(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]">
                      <option value="">Suggest a course...</option>
                      {ACADEMY.filter(c => !academyBadges.some(b => b.course_slug === c.slug)).map(c => (
                        <option key={c.slug} value={c.slug}>{c.title}</option>
                      ))}
                    </select>
                    {suggestSlug && (
                      <button type="button" disabled={suggestBusy}
                        onClick={async () => {
                          setSuggestBusy(true)
                          try {
                            const res = await fetch('/api/academy/suggest', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ candidateId: profileId, courseSlug: suggestSlug }),
                            })
                            if (res.ok) setSuggestNotice(`Suggested - ${profile.full_name?.split(' ')[0] || 'they'} will be told your property would value this training.`)
                          } catch { } finally { setSuggestBusy(false) }
                        }}
                        className="btn-secondary !py-1.5 text-[12px] disabled:opacity-50">
                        {suggestBusy ? 'Sending...' : 'Send suggestion'}
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
            <div className="shrink-0">
              {profile.hourly_rate
                ? <p className="text-[20px] font-semibold text-accent mb-1">£{profile.hourly_rate}<span className="text-[12px] font-normal text-muted"> /hour</span></p>
                : (profile.day_rate_min || profile.day_rate_max) && <p className="text-[20px] font-semibold text-accent mb-1">£{profile.day_rate_min}{profile.day_rate_max ? `-£${profile.day_rate_max}` : ''}<span className="text-[12px] font-normal text-muted"> /day</span></p>}
              <a href="#enquire" className="btn-primary block text-center mt-2">{offer ? 'View Current Offer' : 'Enquire Now'}</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-6">
            {profile.bio && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">About</h2>
                <p className="text-[14px] text-secondary leading-[1.8] whitespace-pre-wrap">{profile.bio}</p>
                {profile.experience_years && <p className="text-[13px] text-muted mt-3">{profile.experience_years} years experience</p>}
              </div>
            )}

            {profile.services_offered?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Services Offered</h2>
                <div className="flex flex-wrap gap-2">{profile.services_offered.map((s: string) => <span key={s} className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>)}</div>
              </div>
            )}

            {profile.product_houses?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Product House Experience</h2>
                <div className="flex flex-wrap gap-2">{profile.product_houses.map((b: string) => <span key={b} className="text-[11px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2.5 py-1 rounded-full">{b}</span>)}</div>
              </div>
            )}

            {profile.qualifications?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Qualifications</h2>
                <div className="space-y-1.5">{profile.qualifications.map((q: string) => <div key={q} className="flex items-center gap-2 text-[13px] text-secondary"><Check size={13} className="text-success" />{q}</div>)}</div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-4">Reviews</h2>
                {(() => {
                  const sums: Record<string, { total: number; n: number }> = {}
                  for (const r of reviews) {
                    if (!r.criteria_scores) continue
                    for (const [k, v] of Object.entries(r.criteria_scores)) {
                      if (typeof v !== 'number') continue
                      if (!sums[k]) sums[k] = { total: 0, n: 0 }
                      sums[k].total += v; sums[k].n += 1
                    }
                  }
                  const avgs: Record<string, number> = {}
                  for (const [k, { total, n }] of Object.entries(sums)) avgs[k] = Math.round((total / n) * 10) / 10
                  if (Object.keys(avgs).length === 0) return null
                  return (
                    <div className="bg-surface rounded-lg p-4 mb-5">
                      <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Score summary ({reviews.length} review{reviews.length === 1 ? '' : 's'})</p>
                      <ReviewBreakdown criteriaScores={avgs} />
                    </div>
                  )
                })()}
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
                    {(r.text || r.comment) && <p className="text-[13px] text-secondary">{r.text || r.comment}</p>}
                  </div>
                ))}</div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-medium text-ink mb-3">Availability</h3>
              <p className="text-[13px] text-secondary mb-2">{profile.availability_status === 'immediately' ? 'Available immediately' : profile.availability_status?.replace('_', ' ') || 'Contact for availability'}</p>
              <p className="text-[13px] text-secondary">Travel: {profile.travel_availability === 'worldwide' ? 'Worldwide' : profile.travel_availability === 'europe' ? 'Europe' : profile.travel_availability === 'radius' ? `Within ${profile.travel_radius_miles || '?'} miles` : 'UK only'}</p>
              {profile.has_car && <p className="text-[12px] text-muted mt-2">Has own transport</p>}
            </div>

            {isEmployer && (
              <div id="enquire" className="scroll-mt-24 bg-white border border-border rounded-xl p-6">
                <h3 className="text-[14px] font-medium text-ink mb-1">Make an Offer</h3>
                <p className="text-[12px] text-muted mb-4">Offer a day rate for an agency shift. {profile.full_name?.split(' ')[0] || 'The candidate'} can accept, decline or counter.</p>

                {offer ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[18px] font-semibold text-accent">£{offer.rate}<span className="text-[12px] font-normal text-muted"> /hour</span></p>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${offer.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-[#FDF6EC] text-accent'}`}>{offer.status}</span>
                    </div>
                    <p className="text-[13px] text-secondary mb-3">
                      {offer.shift_date ? new Date(offer.shift_date).toLocaleDateString() : ''}{offer.hours ? ` · ${offer.hours} hours` : ''}
                    </p>
                    {offer.status === 'pending' && <p className="text-[13px] text-muted">Offer sent - awaiting a response.</p>}
                    {offer.status === 'countered' && (
                      <div>
                        <p className="text-[13px] text-secondary mb-3">{profile.full_name?.split(' ')[0] || 'The candidate'} has countered with £{offer.rate} per hour{offer.hours ? ` (£${offer.rate * offer.hours} for ${offer.hours} hours + £${offer.platform_fee || Math.ceil(offer.rate * offer.hours * AGENCY_PLATFORM_FEE_PCT)} WHC fee)` : ''}.</p>
                        <div className="flex gap-2">
                          <button onClick={() => actOnOffer('accept')} disabled={offerBusy} className="btn-primary flex-1 text-[12px] disabled:opacity-50">Accept Counter</button>
                          <button onClick={() => actOnOffer('decline')} disabled={offerBusy} className="btn-secondary flex-1 text-[12px] disabled:opacity-50">Decline</button>
                        </div>
                      </div>
                    )}
                    {offerError && <p className="text-[12px] text-red-600 mt-3">{offerError}</p>}
                  </div>
                ) : (
                  <form onSubmit={submitOffer} className="space-y-3">
                    <div>
                      <label className="text-[12px] text-muted block mb-1">Hourly rate (£)</label>
                      <input name="rate" type="number" min={1} required value={offerRate}
                        onChange={(e) => setOfferRate(e.target.value)}
                        placeholder={profile.hourly_rate ? `Their usual rate: £${profile.hourly_rate}/hr` : 'e.g. 25'}
                        className="input-field text-[13px]" />
                      {profile.hourly_rate ? <p className="text-[11px] text-muted mt-1">{profile.full_name?.split(' ')[0] || 'They'} usually charges £{profile.hourly_rate}/hour.</p> : null}
                    </div>
                    <div>
                      <label className="text-[12px] text-muted block mb-1">Shift date</label>
                      <input name="shiftDate" type="date" required className="input-field text-[13px]" />
                      <p className="text-[11px] text-muted mt-1">Pick today for urgent cover - the candidate is alerted instantly by text and email, and the offer expires after 4 hours.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[12px] text-muted block mb-1">Starts</label><input name="shiftStartTime" type="time" required value={offerStartTime} onChange={(e) => setOfferStartTime(e.target.value)} className="input-field text-[13px]" /></div>
                      <div><label className="text-[12px] text-muted block mb-1">Finishes</label><input name="shiftEndTime" type="time" required value={offerEndTime} onChange={(e) => setOfferEndTime(e.target.value)} className="input-field text-[13px]" /></div>
                    </div>
                    <p className="text-[11px] text-muted">The offer is accepted only if their confirmed availability covers this entire window.</p>
                    <div>
                      <label className="text-[12px] text-muted block mb-1">Shift type</label>
                      <select name="shiftType" className="input-field text-[13px]" defaultValue="Full Day">
                        <option>Full Day</option><option>Half Day (AM)</option><option>Half Day (PM)</option><option>Evening</option><option>Event Cover</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] text-muted block mb-1">Repeat</label>
                      <select name="repeatWeeks" className="input-field text-[13px]" defaultValue="1">
                        <option value="1">Just this shift</option><option value="2">Weekly for 2 weeks</option><option value="3">Weekly for 3 weeks</option><option value="4">Weekly for 4 weeks</option><option value="6">Weekly for 6 weeks</option><option value="8">Weekly for 8 weeks</option>
                      </select>
                      <p className="text-[11px] text-muted mt-1">A standing booking sends one offer per week on the same weekday - they can accept the lot in one tap.</p>
                    </div>
                    {previewSubtotal > 0 && (
                      <div className="bg-surface rounded-lg p-3 text-[12px] space-y-1">
                        <div className="flex justify-between text-secondary"><span>{previewHours} hours × £{previewRate}/hr</span><span>£{previewSubtotal}</span></div>
                        <div className="flex justify-between text-secondary"><span>WHC fee ({Math.round(AGENCY_PLATFORM_FEE_PCT * 100)}%)</span><span>£{previewFee}</span></div>
                        <div className="flex justify-between font-semibold text-ink pt-1 border-t border-border"><span>You pay</span><span>£{previewTotal}</span></div>
                      </div>
                    )}
                    {offerError && <p className="text-[12px] text-red-600">{offerError}</p>}
                    <button type="submit" disabled={offerBusy} className="btn-primary w-full text-[12px] disabled:opacity-50">{offerBusy ? 'Sending...' : history.length > 0 ? 'Book Again - Send Offer' : 'Send Offer'}</button>
                  </form>
                )}
              </div>
            )}

            {isEmployer && history.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="text-[14px] font-medium text-ink mb-3">Your bookings with {profile.full_name?.split(' ')[0] || 'this therapist'}</h3>
                <div className="space-y-3">
                  {history.map((b) => (
                    <div key={b.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12px] font-medium text-ink">{b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}{b.shift_type ? ` · ${b.shift_type}` : ''}{b.hours ? ` · ${b.hours}h` : ''}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.status === 'accepted' ? 'bg-blue-50 text-blue-700' : b.status === 'confirmed' || b.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.status}</span>
                      </div>
                      <p className="text-[11px] text-muted">£{b.rate}/hour{b.hours ? ` · £${b.rate * b.hours + (b.platform_fee || Math.ceil(b.rate * b.hours * AGENCY_PLATFORM_FEE_PCT))} total incl. WHC fee` : ''}</p>
                      {b.status === 'accepted' && <a href="/employer/agency" className="text-[11px] font-medium text-accent underline">Awaiting payment - pay &amp; confirm in Agency Bookings</a>}
                      {b.status === 'confirmed' && <p className="text-[11px] text-green-700">Paid - WHC pays {profile.full_name?.split(' ')[0] || 'the therapist'} after the shift.</p>}
                    </div>
                  ))}
                </div>
                {profile.user_id && history.some((b) => ['accepted', 'confirmed', 'completed'].includes(b.status)) && (
                  <button type="button" onClick={() => setShowReview(true)} className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-amber-500 hover:underline"><Star size={12} /> Review {profile.full_name?.split(' ')[0] || 'this candidate'}</button>
                )}
              </div>
            )}

            {!isEmployer && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="text-[14px] font-medium text-ink mb-2">Book {profile.full_name?.split(' ')[0] || 'this therapist'} for a shift</h3>
                <p className="text-[12px] text-muted mb-4">Sign in as an employer to make a shift offer with your date, hours and hourly rate.</p>
                <a href="/login?role=employer" className="btn-primary block w-full text-center text-[12px]">Employer Sign In</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReview && profile?.user_id && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReview(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">Review {profile.full_name}</h2>
              <button type="button" onClick={() => setShowReview(false)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <ReviewForm reviewedId={profile.user_id} reviewedName={profile.full_name} type="candidate" />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}