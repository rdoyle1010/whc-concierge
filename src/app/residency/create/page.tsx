'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_HOUSES, TRAVEL_OPTIONS } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import Link from 'next/link'
import { ArrowLeft, Check, Upload } from 'lucide-react'

const SERVICES_FLAT = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','Reflexology','Reiki','Sound Healing','Breathwork','Yoga','Pilates','Meditation','Acupuncture','Ayurvedic Treatments','Facials','Body Wraps','Holistic Therapy','Beauty Therapy','Nail Services','Hair Styling','Personal Training','Nutrition Consultation']
const QUALS_FLAT = ['CIDESCO','CIBTAC','ITEC','VTCT','NVQ Level 2','NVQ Level 3','NVQ Level 4','First Aid','Hot Stone Certified','Reiki Master','Yoga Teacher 200hr','Yoga Teacher 500hr','Pilates Instructor']
const DURATION_OPTIONS = ['1 day','3 days','1 week','2 weeks','1 month','3 months','6 months','Flexible']

export default function ResidencyCreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '',
    services_offered: [] as string[], product_houses: [] as string[], qualifications: [] as string[],
    availability_start: '', min_duration: '', max_duration: '',
    day_rate: '', weekly_rate: '', monthly_rate: '', negotiable: true,
    travel_availability: 'uk_only', travel_radius_miles: '', postcode: '',
  })

  const u = (f: string, v: any) => setForm({ ...form, [f]: v })

  // Auto-calc rates
  const autoWeekly = form.day_rate ? String(parseInt(form.day_rate) * 5) : ''
  const autoMonthly = form.day_rate ? String(parseInt(form.day_rate) * 20) : ''

  const handleSubmit = async () => {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in'); setLoading(false); return }

    const res = await fetch('/api/upload', { method: 'POST', body: (() => { const fd = new FormData(); return fd })() }).catch(() => null)

    const { error: insertError } = await supabase.from('residency_profiles').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      services_offered: form.services_offered.length > 0 ? form.services_offered : null,
      product_houses: form.product_houses.length > 0 ? form.product_houses : null,
      day_rate: form.day_rate ? parseInt(form.day_rate) : null,
      weekly_rate: form.weekly_rate ? parseInt(form.weekly_rate) : (autoWeekly ? parseInt(autoWeekly) : null),
      monthly_rate: form.monthly_rate ? parseInt(form.monthly_rate) : (autoMonthly ? parseInt(autoMonthly) : null),
      travel_availability: form.travel_availability,
      travel_radius_miles: form.travel_radius_miles ? parseInt(form.travel_radius_miles) : null,
      availability_start: form.availability_start || null,
      duration: form.min_duration || null,
      approval_status: 'pending',
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/residency?submitted=true')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border px-6 py-4 max-w-3xl mx-auto flex items-center gap-4">
        <Link href="/residency" className="text-muted hover:text-ink"><ArrowLeft size={18} /></Link>
        <span className="text-ink font-semibold tracking-tight">Create Residency Listing</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-7 h-7 flex items-center justify-center text-[11px] font-medium rounded-full ${step > s ? 'bg-ink text-white' : step === s ? 'border-2 border-ink text-ink' : 'border border-border text-muted'}`}>{step > s ? <Check size={12} /> : s}</div>
              {s < 5 && <div className={`flex-1 h-px mx-1.5 ${step > s ? 'bg-ink' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded-lg mb-6">{error}</div>}

        {/* Step 1: About */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="eyebrow mb-4">Step 1 — About Your Residency</p>
            <div><label className="eyebrow block mb-1.5">Title *</label><input type="text" value={form.title} onChange={e => u('title', e.target.value)} className="input-field" placeholder="e.g. ESPA Specialist Available for Luxury Hotel Residency" /></div>
            <div><label className="eyebrow block mb-1.5">Description</label><textarea rows={5} value={form.description} onChange={e => u('description', e.target.value)} className="input-field" placeholder="Describe your offering, approach, and what makes your residency unique..." maxLength={500} /><p className="text-[11px] text-muted mt-1">{form.description.length}/500</p></div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.title} className="btn-primary w-full disabled:opacity-40">Continue</button>
          </div>
        )}

        {/* Step 2: Services & Skills */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="eyebrow mb-4">Step 2 — Services & Skills</p>
            <CollapsibleCheckboxSection title="Services Offered" flatItems={SERVICES_FLAT} selected={form.services_offered} onChange={v => u('services_offered', v)} />
            <CollapsibleCheckboxSection title="Product Houses" flatItems={[...PRODUCT_HOUSES]} selected={form.product_houses} onChange={v => u('product_houses', v)} />
            <CollapsibleCheckboxSection title="Qualifications" flatItems={QUALS_FLAT} selected={form.qualifications} onChange={v => u('qualifications', v)} />
            <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button></div>
          </div>
        )}

        {/* Step 3: Availability & Rates */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="eyebrow mb-4">Step 3 — Availability & Rates</p>
            <div><label className="eyebrow block mb-1.5">Available From</label><input type="date" value={form.availability_start} onChange={e => u('availability_start', e.target.value)} className="input-field" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Minimum Duration</label><select value={form.min_duration} onChange={e => u('min_duration', e.target.value)} className="input-field"><option value="">Select</option>{DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label className="eyebrow block mb-1.5">Maximum Duration</label><select value={form.max_duration} onChange={e => u('max_duration', e.target.value)} className="input-field"><option value="">Select</option>{DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Day Rate (£)</label><input type="number" value={form.day_rate} onChange={e => u('day_rate', e.target.value)} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Weekly Rate (£)</label><input type="number" value={form.weekly_rate || autoWeekly} onChange={e => u('weekly_rate', e.target.value)} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Monthly Rate (£)</label><input type="number" value={form.monthly_rate || autoMonthly} onChange={e => u('monthly_rate', e.target.value)} className="input-field" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.negotiable} onChange={e => u('negotiable', e.target.checked)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">Open to negotiation for longer bookings</span></label>
            <div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">Continue</button></div>
          </div>
        )}

        {/* Step 4: Location & Travel */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="eyebrow mb-4">Step 4 — Location & Travel</p>
            <div><label className="eyebrow block mb-1.5">Based In (Postcode)</label><input type="text" value={form.postcode} onChange={e => u('postcode', e.target.value)} className="input-field" /></div>
            <div>
              <label className="eyebrow block mb-2">Travel Availability</label>
              <div className="flex flex-wrap gap-2">{TRAVEL_OPTIONS.map(t => (
                <button type="button" key={t.value} onClick={() => u('travel_availability', t.value)} className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${form.travel_availability === t.value ? 'bg-ink text-white' : 'bg-surface text-muted border border-border'}`}>{t.label}</button>
              ))}</div>
            </div>
            {form.travel_availability === 'radius' && (
              <div><label className="eyebrow block mb-1.5">Radius (miles)</label><input type="number" value={form.travel_radius_miles} onChange={e => u('travel_radius_miles', e.target.value)} className="input-field" placeholder="50" /></div>
            )}
            <div className="flex gap-3"><button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(5)} className="btn-primary flex-1">Review</button></div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-5">
            <p className="eyebrow mb-4">Step 5 — Review & Submit</p>

            <div className="bg-white border border-border rounded-xl p-6 space-y-3">
              <h3 className="text-[17px] font-medium text-ink">{form.title}</h3>
              {form.description && <p className="text-[13px] text-secondary">{form.description}</p>}
              {form.services_offered.length > 0 && <div className="flex flex-wrap gap-1">{form.services_offered.map(s => <span key={s} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>}
              {form.product_houses.length > 0 && <div className="flex flex-wrap gap-1">{form.product_houses.map(b => <span key={b} className="text-[10px] bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}</div>}
              <div className="flex gap-3 text-[13px]">
                {form.day_rate && <span className="bg-surface px-2.5 py-1 rounded-lg font-medium text-ink">£{form.day_rate}/day</span>}
                {(form.weekly_rate || autoWeekly) && <span className="bg-surface px-2.5 py-1 rounded-lg font-medium text-ink">£{form.weekly_rate || autoWeekly}/week</span>}
              </div>
              <p className="text-[12px] text-muted">Travel: {form.travel_availability.replace('_', ' ')} {form.availability_start ? `· From ${form.availability_start}` : ''} {form.min_duration ? `· Min ${form.min_duration}` : ''}</p>
            </div>

            <div className="bg-surface p-4 rounded-lg text-[13px] text-muted">
              Your listing will be reviewed by the WHC team before going live. This usually takes less than 24 hours.
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(4)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">{loading ? 'Submitting...' : 'Submit for Approval'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
