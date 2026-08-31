'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_HOUSES } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import Link from 'next/link'
import { ArrowLeft, Check, Crown, ShieldCheck } from 'lucide-react'

const SERVICES_FLAT = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','Reflexology','Reiki','Sound Healing','Breathwork','Yoga','Pilates','Meditation','Acupuncture','Ayurvedic Treatments','Facials','Body Wraps','Holistic Therapy','Beauty Therapy','Nail Services','Hair Styling','Personal Training','Nutrition Consultation']
const QUALS_FLAT = ['CIDESCO','CIBTAC','ITEC','VTCT','NVQ Level 2','NVQ Level 3','NVQ Level 4','First Aid','Hot Stone Certified','Reiki Master','Yoga Teacher 200hr','Yoga Teacher 500hr','Pilates Instructor']
const DURATION_OPTIONS = ['1-2 months','3-4 months','5-6 months','Flexible']
const RESIDENCY_TRAVEL_OPTIONS = ['UK Only','Europe','Middle East','Asia Pacific','Global']

export default function ResidencyCreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingMembership, setCheckingMembership] = useState(true)
  const [membershipActive, setMembershipActive] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', services_offered: [] as string[], product_houses: [] as string[], qualifications: [] as string[],
    availability_start: '', preferred_duration: '', day_rate: '', weekly_rate: '', monthly_rate: '', negotiable: true,
    travel_availability: 'UK Only', postcode: '',
  })
  const u = (f: string, v: any) => setForm({ ...form, [f]: v })
  const autoWeekly = form.day_rate ? String(parseInt(form.day_rate) * 5) : ''
  const autoMonthly = form.day_rate ? String(parseInt(form.day_rate) * 20) : ''

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login?role=talent&returnTo=/residency/create'); return }

      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('membership_session')
      let confirmedNow = false
      if (sessionId) {
        const res = await fetch('/api/residency/confirm-membership', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
        if (res.ok) {
          confirmedNow = true
          window.history.replaceState({}, '', '/residency/create?membership=active')
        }
      }

      // A raw session id in the URL proves nothing - only a successful
      // confirmation or an already-active membership unlocks the wizard.
      const { data: candidate } = await supabase.from('candidate_profiles').select('residency_member').eq('user_id', user.id).maybeSingle()
      setMembershipActive(candidate?.residency_member === true || confirmedNow)
      setCheckingMembership(false)

      // Prefill from the existing listing - editing resubmits for review
      // rather than creating a duplicate.
      try {
        const res = await fetch('/api/residency/create')
        const json = await res.json()
        const listing = json?.listing
        if (listing) {
          setForm(current => ({
            ...current,
            title: listing.primary_specialism || current.title,
            description: listing.bio || current.description,
            services_offered: listing.secondary_specialisms || current.services_offered,
            product_houses: listing.brand_experience || current.product_houses,
            qualifications: listing.qualifications || current.qualifications,
            availability_start: listing.available_from || current.availability_start,
            preferred_duration: listing.preferred_duration || current.preferred_duration,
            day_rate: listing.day_rate ? String(listing.day_rate) : current.day_rate,
            weekly_rate: listing.weekly_rate ? String(listing.weekly_rate) : current.weekly_rate,
            monthly_rate: listing.monthly_rate ? String(listing.monthly_rate) : current.monthly_rate,
            negotiable: listing.negotiable !== false,
            travel_availability: listing.will_travel_to || current.travel_availability,
            postcode: listing.current_location || current.postcode,
          }))
        }
      } catch { /* fresh wizard */ }
    })()
  }, [router, supabase])

  async function startMembership() {
    setLoading(true); setError('')
    const res = await fetch('/api/residency/membership-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnUrl: window.location.origin }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || 'Could not start membership.'); setLoading(false); return }
    window.location.href = data.url
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in'); setLoading(false); return }
    const res = await fetch('/api/residency/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      title: form.title, description: form.description, services_offered: form.services_offered, qualifications: form.qualifications,
      product_houses: form.product_houses, weekly_rate: form.weekly_rate || autoWeekly || null, day_rate: form.day_rate || null,
      monthly_rate: form.monthly_rate || null, negotiable: !!form.negotiable, travel_availability: form.travel_availability,
      availability_start: form.availability_start || null, preferred_duration: form.preferred_duration || null, postcode: form.postcode || null,
    }) })
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || 'Something went wrong - please try again.'); setLoading(false); return }
    router.push('/residency?submitted=true')
  }

  if (checkingMembership) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="skeleton h-36 w-full max-w-xl rounded-2xl" /></div>

  if (!membershipActive) return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="border-b border-border bg-white px-6 py-4"><div className="max-w-3xl mx-auto flex items-center gap-4"><Link href="/residency" className="text-muted hover:text-ink"><ArrowLeft size={18}/></Link><span className="text-ink font-semibold">Join Residency</span></div></div>
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="bg-white border border-border rounded-[28px] p-8 md:p-10 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-parchment flex items-center justify-center mb-6"><Crown className="text-accent" size={22}/></div>
          <p className="eyebrow mb-3">Residency Membership</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight max-w-xl">Be discovered for luxury spa residencies.</h1>
          <p className="text-sm text-secondary leading-7 mt-4 max-w-2xl">Residency is a paid specialist marketplace. Your membership gives you a live residency profile, structured hotel offers and an on-platform booking record rather than a free directory listing.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-3">
            {['Premium residency profile','Receive hotel offers','Verified booking history'].map(x => <div key={x} className="rounded-xl bg-surface p-4 text-sm text-ink flex items-center gap-2"><Check size={15} className="text-accent"/>{x}</div>)}
          </div>
          <div className="mt-8 rounded-2xl border border-accent/20 bg-parchment/50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><p className="text-2xl font-semibold text-ink">£10<span className="text-sm font-normal text-muted">/month</span></p><p className="text-xs text-muted mt-1">Cancel your subscription when you no longer want to be listed.</p></div><button onClick={startMembership} disabled={loading} className="btn-primary min-w-[190px]">{loading ? 'Opening Checkout...' : 'Join Residency'}</button></div>
          <div className="mt-5 flex items-start gap-2 text-xs text-muted"><ShieldCheck size={15} className="text-accent shrink-0"/><p>When a property books you, the property pays a 10% WHC Concierge booking fee. Your agreed residency rate stays separate from that fee.</p></div>
          {error && <p role="alert" className="text-sm text-red-600 mt-5">{error}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border px-6 py-4 max-w-3xl mx-auto flex items-center gap-4"><Link href="/residency" className="text-muted hover:text-ink"><ArrowLeft size={18} /></Link><span className="text-ink font-semibold tracking-tight">Create Residency Listing</span><span className="ml-auto text-[10px] uppercase tracking-[.12em] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Membership active</span></div>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-10">{[1,2,3,4,5].map(s => <div key={s} className="flex items-center flex-1"><div className={`w-7 h-7 flex items-center justify-center text-[11px] font-medium rounded-full ${step > s ? 'bg-ink text-white' : step === s ? 'border-2 border-ink text-ink' : 'border border-border text-muted'}`}>{step > s ? <Check size={12} /> : s}</div>{s < 5 && <div className={`flex-1 h-px mx-1.5 ${step > s ? 'bg-ink' : 'bg-border'}`} />}</div>)}</div>
        {error && <div role="alert" className="bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded-lg mb-6">{error}</div>}

        {step === 1 && <div className="space-y-5"><p className="eyebrow mb-4">Step 1 - About Your Residency</p><div><label className="eyebrow block mb-1.5">Title *</label><input aria-label="Title" type="text" value={form.title} onChange={e => u('title', e.target.value)} className="input-field" placeholder="e.g. Advanced Facialist Available for Luxury Hotel Residency" /></div><div><label className="eyebrow block mb-1.5">Description</label><textarea aria-label="Description" rows={5} value={form.description} onChange={e => u('description', e.target.value)} className="input-field" placeholder="Describe your approach, signature treatments and the type of residency you are looking for..." maxLength={500}/><p className="text-[11px] text-muted mt-1">{form.description.length}/500</p></div><button type="button" onClick={() => setStep(2)} disabled={!form.title} className="btn-primary w-full disabled:opacity-40">Continue</button></div>}

        {step === 2 && <div className="space-y-5"><p className="eyebrow mb-4">Step 2 - Services & Skills</p><CollapsibleCheckboxSection title="Services Offered" flatItems={SERVICES_FLAT} selected={form.services_offered} onChange={v => u('services_offered', v)} /><CollapsibleCheckboxSection title="Product Houses" flatItems={[...PRODUCT_HOUSES]} selected={form.product_houses} onChange={v => u('product_houses', v)} /><CollapsibleCheckboxSection title="Qualifications" flatItems={QUALS_FLAT} selected={form.qualifications} onChange={v => u('qualifications', v)} /><div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button></div></div>}

        {step === 3 && <div className="space-y-5"><p className="eyebrow mb-4">Step 3 - Availability & Rates</p><div><label className="eyebrow block mb-1.5">Available From</label><input aria-label="Available From" type="date" value={form.availability_start} onChange={e => u('availability_start', e.target.value)} className="input-field" /></div><div><label className="eyebrow block mb-1.5">Preferred Duration</label><select aria-label="Preferred Duration" value={form.preferred_duration} onChange={e => u('preferred_duration', e.target.value)} className="input-field"><option value="">Select</option>{DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div><div className="grid grid-cols-3 gap-4"><div><label className="eyebrow block mb-1.5">Day Rate (£)</label><input aria-label="Day Rate (£)" type="number" value={form.day_rate} onChange={e => u('day_rate', e.target.value)} className="input-field" /></div><div><label className="eyebrow block mb-1.5">Weekly Rate (£)</label><input aria-label="Weekly Rate (£)" type="number" value={form.weekly_rate || autoWeekly} onChange={e => u('weekly_rate', e.target.value)} className="input-field" /></div><div><label className="eyebrow block mb-1.5">Monthly Rate (£)</label><input aria-label="Monthly Rate (£)" type="number" value={form.monthly_rate || autoMonthly} onChange={e => u('monthly_rate', e.target.value)} className="input-field" /></div></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.negotiable} onChange={e => u('negotiable', e.target.checked)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">Open to negotiation for longer bookings</span></label><div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">Continue</button></div></div>}

        {step === 4 && <div className="space-y-5"><p className="eyebrow mb-4">Step 4 - Location & Travel</p><div><label className="eyebrow block mb-1.5">Based In (Postcode)</label><input aria-label="Based In (Postcode)" type="text" value={form.postcode} onChange={e => u('postcode', e.target.value)} className="input-field" /></div><div><label className="eyebrow block mb-2">Travel Availability</label><div className="flex flex-wrap gap-2">{RESIDENCY_TRAVEL_OPTIONS.map(t => <button type="button" key={t} onClick={() => u('travel_availability', t)} className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${form.travel_availability === t ? 'bg-ink text-white' : 'bg-surface text-muted border border-border'}`}>{t}</button>)}</div></div><div className="flex gap-3"><button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(5)} className="btn-primary flex-1">Review</button></div></div>}

        {step === 5 && <div className="space-y-5"><p className="eyebrow mb-4">Step 5 - Review & Submit</p><div className="bg-white border border-border rounded-xl p-6 space-y-3"><h3 className="text-[17px] font-medium text-ink">{form.title}</h3>{form.description && <p className="text-[13px] text-secondary">{form.description}</p>}{form.services_offered.length > 0 && <div className="flex flex-wrap gap-1">{form.services_offered.map(s => <span key={s} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>}{form.product_houses.length > 0 && <div className="flex flex-wrap gap-1">{form.product_houses.map(b => <span key={b} className="text-[10px] bg-[#f5f6f8] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}</div>}<div className="flex gap-3 text-[13px]">{form.day_rate && <span className="bg-surface px-2.5 py-1 rounded-lg font-medium text-ink">£{form.day_rate}/day</span>}{(form.weekly_rate || autoWeekly) && <span className="bg-surface px-2.5 py-1 rounded-lg font-medium text-ink">£{form.weekly_rate || autoWeekly}/week</span>}</div><p className="text-[12px] text-muted">Travel: {form.travel_availability} {form.availability_start ? `· From ${form.availability_start}` : ''} {form.preferred_duration ? `· ${form.preferred_duration}` : ''}</p></div><div className="bg-surface p-4 rounded-lg text-[13px] text-secondary">Your paid membership is active. Your listing will be reviewed by the WHC Concierge team before going live.</div><div className="flex gap-3"><button type="button" onClick={() => setStep(4)} className="btn-secondary flex-1">Back</button><button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">{loading ? 'Submitting...' : 'Submit for Approval'}</button></div></div>}
      </div>
    </div>
  )
}
