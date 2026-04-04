'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LEVELS, PRODUCT_HOUSES, QUALIFICATIONS, CONTRACT_TYPES, JOB_TIERS } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { Check } from 'lucide-react'

const tierCards = [
  { key: 'Bronze', price: '£150', days: 30, features: ['30-day listing', 'Basic matching', 'Applicant tracking'] },
  { key: 'Silver', price: '£200', days: 60, features: ['60-day listing', 'Enhanced matching', 'Priority support', 'Applicant tracking'] },
  { key: 'Gold', price: '£225', days: 75, features: ['75-day listing', 'Advanced matching', 'Featured placement', 'Direct messaging'] },
  { key: 'Platinum', price: '£250', days: 90, features: ['90-day listing', 'Priority matching', 'Homepage featuring', 'Social promotion', 'Full analytics'] },
]

export default function PostRolePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [phase, setPhase] = useState<'form' | 'tier'>('form')
  const [selectedTier, setSelectedTier] = useState('Silver')
  const [saving, setSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', location: '', location_postcode: '',
    radius_miles: '', job_type: 'Full-time', contract_type: 'permanent',
    required_role_level: '', salary_min: '', salary_max: '', specialism: '',
    required_product_houses: [] as string[],
    required_qualifications: [] as string[],
    requirements: '', benefits: '',
    insurance_required: false, is_agency_role: false, is_residency_role: false,
  })

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const handleSaveAndPay = async () => {
    if (!profile || !form.title) return
    setSaving(true)
    setError('')

    // Create the job listing first
    const tierConfig = JOB_TIERS[selectedTier as keyof typeof JOB_TIERS]
    const expiresAt = new Date(Date.now() + (tierConfig?.days || 30) * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('job_listings').insert({
      employer_id: profile.id,
      job_title: form.title,
      job_description: form.description,
      location: form.location,
      location_postcode: form.location_postcode || null,
      radius_miles: form.radius_miles ? parseInt(form.radius_miles) : null,
      job_type: form.job_type,
      contract_type: form.contract_type,
      required_role_level: form.required_role_level || null,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      required_brands: form.required_product_houses.length > 0 ? form.required_product_houses : null,
      required_qualifications: form.required_qualifications.length > 0 ? form.required_qualifications : null,
      insurance_required: form.insurance_required,
      is_agency_role: form.is_agency_role,
      is_residency_role: form.is_residency_role,
      is_live: true,
      tier: selectedTier,
      status: 'active',
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    // Redirect to Stripe checkout
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'job_posting', tier: selectedTier, employerId: profile.id, returnUrl: window.location.origin }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      // Payment failed but job still created — redirect to jobs
      router.push('/employer/jobs?success=true')
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-bold text-black mb-2">Post a Role</h1>
      <p className="text-neutral-400 text-sm mb-8">Create your job listing, then select a package.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

      {phase === 'form' ? (
        <div className="max-w-2xl space-y-6">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Job Details</p>

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Job Title *</label>
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className="input-field" placeholder="e.g. Senior Spa Therapist" /></div>

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Description *</label>
            <textarea rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" placeholder="Describe the role, responsibilities, and ideal candidate..." /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Role Level</label>
              <select value={form.required_role_level} onChange={(e) => update('required_role_level', e.target.value)} className="input-field">
                <option value="">Any level</option>
                {ROLE_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Contract Type</label>
              <select value={form.contract_type} onChange={(e) => update('contract_type', e.target.value)} className="input-field">
                {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Location *</label>
              <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="London" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Postcode</label>
              <input type="text" value={form.location_postcode} onChange={(e) => update('location_postcode', e.target.value)} className="input-field" placeholder="SW1A 1AA" /></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Min Salary (£)</label>
              <input type="number" value={form.salary_min} onChange={(e) => update('salary_min', e.target.value)} className="input-field" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Max Salary (£)</label>
              <input type="number" value={form.salary_max} onChange={(e) => update('salary_max', e.target.value)} className="input-field" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Job Type</label>
              <select value={form.job_type} onChange={(e) => update('job_type', e.target.value)} className="input-field">
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option><option>Freelance</option>
              </select></div>
          </div>

          <CollapsibleCheckboxSection title="Required Product Houses" flatItems={[...PRODUCT_HOUSES]} selected={form.required_product_houses} onChange={(v) => update('required_product_houses', v)} />
          <CollapsibleCheckboxSection title="Required Qualifications" flatItems={[...QUALIFICATIONS]} selected={form.required_qualifications} onChange={(v) => update('required_qualifications', v)} />

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Requirements (one per line)</label>
            <textarea rows={3} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} className="input-field" placeholder="CIDESCO qualified&#10;3+ years luxury spa experience" /></div>

          <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Benefits (one per line)</label>
            <textarea rows={3} value={form.benefits} onChange={(e) => update('benefits', e.target.value)} className="input-field" placeholder="Staff accommodation&#10;Treatment allowance" /></div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.insurance_required} onChange={(e) => update('insurance_required', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Insurance required</span></label>
            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.is_agency_role} onChange={(e) => update('is_agency_role', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Agency role</span></label>
            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.is_residency_role} onChange={(e) => update('is_residency_role', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Residency role</span></label>
          </div>

          <button onClick={() => setPhase('tier')} disabled={!form.title || !form.location} className="btn-primary w-full disabled:opacity-40">Continue to Select Package</button>
        </div>
      ) : (
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Select Package</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {tierCards.map((tier) => (
              <div key={tier.key} onClick={() => setSelectedTier(tier.key)}
                className={`border p-6 cursor-pointer transition-all ${selectedTier === tier.key ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                <h3 className="font-bold text-black mb-1">{tier.key}</h3>
                <p className="text-2xl font-bold text-black">{tier.price}</p>
                <p className="text-xs text-neutral-400 mb-4">{tier.days} days</p>
                <ul className="space-y-2">{tier.features.map((f) => (
                  <li key={f} className="flex items-center space-x-2 text-xs text-neutral-500"><Check size={12} className="text-black flex-shrink-0" /><span>{f}</span></li>
                ))}</ul>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPhase('form')} className="btn-secondary">Back to Edit</button>
            <button onClick={handleSaveAndPay} disabled={saving || checkoutLoading} className="btn-primary disabled:opacity-50">
              {checkoutLoading ? 'Redirecting to payment...' : saving ? 'Saving...' : `Post Role — ${tierCards.find(t => t.key === selectedTier)?.price}`}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
