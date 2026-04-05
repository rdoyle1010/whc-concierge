'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_HOUSES, SYSTEMS, COMPANY_TYPES } from '@/lib/constants'
import CheckboxGroup from '@/components/CheckboxGroup'
import { Check } from 'lucide-react'

export default function EmployerRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    company_name: '', contact_name: '', work_email: '', website: '',
    company_type: '', postcode: '', description: '', phone: '',
    product_houses_used: [] as string[], systems_used: [] as string[],
    treatment_rooms: '', team_size: '', agreed_terms: false,
  })

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { role: 'employer', company_name: form.company_name } }
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Registration failed'); setLoading(false); return }

    const profileData: Record<string, any> = {
      user_id: authData.user.id,
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || null,
      website: form.website || null,
      location: form.postcode || null,
      postcode: form.postcode || null,
      company_type: form.company_type || null,
      description: form.description || null,
      product_houses_used: form.product_houses_used.length > 0 ? form.product_houses_used : null,
      systems_used: form.systems_used.length > 0 ? form.systems_used : null,
      approval_status: 'pending',
    }

    // POST to server-side API route (uses service role key to bypass RLS)
    const res = await fetch('/api/register/employer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authData.user.id, profileData }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create profile')
      setLoading(false)
      return
    }

    router.push('/employer/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={130} height={42} className="object-contain mix-blend-multiply" /></Link>
        <Link href="/login?role=employer" className="text-sm text-neutral-400 hover:text-black">Already registered?</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-black mb-2">Register your property</h1>
        <p className="text-neutral-400 mb-10">Access the finest wellness talent in the industry</p>

        {/* Progress */}
        <div className="flex items-center space-x-2 mb-10">
          {[1,2,3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                step > s ? 'bg-black text-white' : step === s ? 'border-2 border-black text-black' : 'border border-neutral-200 text-neutral-300'
              }`}>{step > s ? <Check size={14} /> : s}</div>
              {s < 3 && <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-black' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Step 1 — Company Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Company / Property Name *</label><input type="text" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Contact Name *</label><input type="text" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Password *</label><input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Confirm *</label><input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Company Type</label>
                <select value={form.company_type} onChange={(e) => update('company_type', e.target.value)} className="input-field"><option value="">Select</option>{COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Postcode</label><input type="text" value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Website</label><input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Description</label><textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" /></div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.company_name || !form.email || !form.password} className="btn-primary w-full disabled:opacity-40">Continue</button>
          </div>
        )}

        {/* Step 2: Spa Operations */}
        {step === 2 && (
          <div className="space-y-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-2">Step 2 — Spa Operations</p>
            <CheckboxGroup label="Product Houses Used" options={PRODUCT_HOUSES} selected={form.product_houses_used} onChange={(v) => update('product_houses_used', v)} />
            <CheckboxGroup label="Systems Used" options={SYSTEMS} selected={form.systems_used} onChange={(v) => update('systems_used', v)} columns={2} />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Treatment Rooms</label><input type="number" value={form.treatment_rooms} onChange={(e) => update('treatment_rooms', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Team Size</label><input type="number" value={form.team_size} onChange={(e) => update('team_size', e.target.value)} className="input-field" /></div>
            </div>
            <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button></div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-2">Step 3 — Verification</p>
            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Work Email (for verification)</label><input type="email" value={form.work_email} onChange={(e) => update('work_email', e.target.value)} className="input-field" placeholder="name@property.com" /></div>
            {/* Terms & Conditions */}
            <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto text-[12px] text-secondary leading-relaxed">
              <p className="font-medium text-ink mb-2">Terms & Conditions — Employer</p>
              <p className="mb-2">By registering a property on WHC Concierge, you agree to the following:</p>
              <p className="mb-2">1. <strong>Accuracy of listings:</strong> All job listings and company information must be accurate and represent genuine vacancies. WHC Concierge reserves the right to remove misleading listings.</p>
              <p className="mb-2">2. <strong>Account review:</strong> All employer accounts are subject to review and approval by the WHC Concierge team before listings become visible to candidates.</p>
              <p className="mb-2">3. <strong>Job posting fees:</strong> Job listings are subject to the pricing tier selected at the time of posting (Bronze £150, Silver £175, Gold £200, Platinum £250). Fees are non-refundable once the listing is published.</p>
              <p className="mb-2">4. <strong>Agency commission:</strong> For shifts booked through the WHC agency marketplace, a 10% platform commission applies to the agreed rate.</p>
              <p className="mb-2">5. <strong>Candidate data:</strong> You agree to handle candidate personal data in accordance with GDPR and our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. Candidate information accessed through the platform must not be shared with third parties.</p>
              <p className="mb-2">6. <strong>Professional conduct:</strong> You agree to treat all candidates fairly and professionally. Discriminatory practices are prohibited.</p>
              <p className="mb-2">7. <strong>Payment terms:</strong> All payments are processed securely through Stripe. You are responsible for fulfilling salary and compensation terms as advertised in your listings.</p>
              <p>8. <strong>Termination:</strong> We reserve the right to suspend or remove your account at any time if you breach these terms.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreed_terms} onChange={(e) => update('agreed_terms', e.target.checked)} className="w-4 h-4 border-border rounded text-ink focus:ring-ink mt-0.5" />
              <span className="text-[13px] text-secondary">I have read and agree to the <Link href="/terms" className="underline text-ink">Terms & Conditions</Link> and <Link href="/privacy" className="underline text-ink">Privacy Policy</Link></span>
            </label>

            <div className="bg-surface p-4 rounded-lg text-[13px] text-muted">
              Your account will be reviewed by our team within 24 hours. You&apos;ll receive an email once approved.
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={handleSubmit} disabled={loading || !form.agreed_terms} className="btn-primary flex-1 disabled:opacity-40">{loading ? 'Creating account...' : 'Submit for Approval'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

