'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_HOUSES, RESIDENCY_DURATIONS, TRAVEL_OPTIONS } from '@/lib/constants'
import CheckboxGroup from '@/components/CheckboxGroup'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SERVICES = [
  'Massage Therapy', 'Beauty Therapy', 'Facials', 'Body Treatments',
  'Yoga', 'Pilates', 'Meditation', 'Nutritional Consultations',
  'Ayurveda', 'Reflexology', 'Aromatherapy', 'Acupuncture',
  'Personal Training', 'Holistic Therapy', 'Nail Services', 'Hair Styling',
]

export default function ResidencyCreatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', duration: '',
    day_rate: '', weekly_rate: '', monthly_rate: '',
    services_offered: [] as string[], product_houses: [] as string[],
    availability_start: '', availability_end: '',
    travel_availability: 'uk_only', video_url: '',
  })

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in first'); setLoading(false); return }

    const { error: insertError } = await supabase.from('residency_profiles').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      duration: form.duration || null,
      day_rate: form.day_rate ? parseInt(form.day_rate) : null,
      weekly_rate: form.weekly_rate ? parseInt(form.weekly_rate) : null,
      monthly_rate: form.monthly_rate ? parseInt(form.monthly_rate) : null,
      services_offered: form.services_offered.length > 0 ? form.services_offered : null,
      product_houses: form.product_houses.length > 0 ? form.product_houses : null,
      availability_start: form.availability_start || null,
      availability_end: form.availability_end || null,
      travel_availability: form.travel_availability,
      video_url: form.video_url || null,
      approval_status: 'pending',
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/residency?submitted=true')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 max-w-3xl mx-auto flex items-center space-x-4">
        <Link href="/residency" className="text-neutral-400 hover:text-black"><ArrowLeft size={18} /></Link>
        <span className="text-black font-semibold tracking-tight">WHC Concierge</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-black mb-2">Create Residency Listing</h1>
        <p className="text-neutral-400 mb-10">Showcase what you offer to luxury properties worldwide.</p>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

        <div className="space-y-6">
          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className="input-field" placeholder="e.g. Visiting Ayurvedic Practitioner Available for Residency" /></div>

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" placeholder="Describe what you offer, your approach, and what makes your residency unique..." /></div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Duration Available</label>
            <div className="flex flex-wrap gap-2">
              {RESIDENCY_DURATIONS.map((d) => (
                <button key={d} onClick={() => update('duration', d)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${form.duration === d ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Day Rate (£)</label><input type="number" value={form.day_rate} onChange={(e) => update('day_rate', e.target.value)} className="input-field" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Weekly Rate (£)</label><input type="number" value={form.weekly_rate} onChange={(e) => update('weekly_rate', e.target.value)} className="input-field" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Monthly Rate (£)</label><input type="number" value={form.monthly_rate} onChange={(e) => update('monthly_rate', e.target.value)} className="input-field" /></div>
          </div>

          <CheckboxGroup label="Services Offered" options={SERVICES} selected={form.services_offered} onChange={(v) => update('services_offered', v)} />
          <CheckboxGroup label="Product Houses" options={PRODUCT_HOUSES} selected={form.product_houses} onChange={(v) => update('product_houses', v)} />

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Available From</label><input type="date" value={form.availability_start} onChange={(e) => update('availability_start', e.target.value)} className="input-field" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Available Until</label><input type="date" value={form.availability_end} onChange={(e) => update('availability_end', e.target.value)} className="input-field" /></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Travel Availability</label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_OPTIONS.map((t) => (
                <button key={t.value} onClick={() => update('travel_availability', t.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${form.travel_availability === t.value ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Video URL (optional)</label>
            <input type="url" value={form.video_url} onChange={(e) => update('video_url', e.target.value)} className="input-field" placeholder="YouTube or Vimeo link" /></div>

          <div className="bg-neutral-50 p-4 text-sm text-neutral-500">
            Your listing will be reviewed by WHC before going live. Approved listings are visible to all registered properties.
          </div>

          <button onClick={handleSubmit} disabled={loading || !form.title} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  )
}
