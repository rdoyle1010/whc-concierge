'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { AGENCY_PLATFORM_FEE_PCT, COMPANY_TYPES, EMPLOYER_MEMBERSHIPS, JOB_TIERS, PRODUCT_HOUSES, SYSTEMS } from '@/lib/constants'
import CheckboxGroup from '@/components/CheckboxGroup'
import { Check } from 'lucide-react'

const pounds = (pence: number) => `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`

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

    const initResponse = await fetch('/api/register/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        role: 'employer',
        displayName: form.company_name,
      }),
    })
    const init = await initResponse.json().catch(() => ({}))
    if (!initResponse.ok || !init.userId || !init.registrationProof) {
      setError(init.error || 'Registration failed')
      setLoading(false)
      return
    }

    if (init.session?.access_token && init.session?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession(init.session)
      if (sessionError) {
        setError('Your account was created, but sign-in could not be completed. Please use the login page.')
        setLoading(false)
        return
      }
    }

    const profileData: Record<string, any> = {
      user_id: init.userId,
      company_name: form.company_name,
      property_name: form.company_name,
      contact_name: form.contact_name,
      contact_email: form.email,
      contact_phone: form.phone || null,
      website: form.website || null,
      location: form.postcode || null,
      postcode: form.postcode || null,
      company_type: form.company_type || null,
      about_text: form.description || null,
      product_houses_used: form.product_houses_used.length > 0 ? form.product_houses_used : null,
      systems_used: form.systems_used.length > 0 ? form.systems_used : null,
      num_treatment_rooms: form.treatment_rooms ? parseInt(form.treatment_rooms) : null,
      team_size: form.team_size ? parseInt(form.team_size) : null,
      work_email: form.work_email || null,
      agreed_terms: form.agreed_terms || false,
      approval_status: 'pending',
    }

    // POST to server-side API route (uses service role key to bypass RLS)
    const res = await fetch('/api/register/employer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: init.userId, profileData, registrationProof: init.registrationProof }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create profile')
      setLoading(false)
      return
    }

    router.push(init.requiresEmailConfirmation ? '/login?registered=1&confirm=1' : '/employer/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Wordmark />
        <Link href="/login?role=employer" className="text-sm text-muted hover:text-ink">Already registered?</Link>
      </div>

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-ink mb-2">Register your property</h1>
        <p className="text-muted mb-10">Access the finest wellness talent in the industry</p>

        {/* Progress */}
        <div className="flex items-center space-x-2 mb-10">
          {[1,2,3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                step > s ? 'bg-accent text-white' : step === s ? 'border-2 border-accent text-accent' : 'border border-border text-muted'
              }`}>{step > s ? <Check size={14} /> : s}</div>
              {s < 3 && <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-xs font-medium text-muted uppercase tracking-widest mb-6">Step 1 - Company Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-company-name">Company / Property Name *</label><input id="emp-company-name" type="text" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-contact-name">Contact Name *</label><input id="emp-contact-name" type="text" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-email">Email *</label><input id="emp-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-password">Password *</label><input id="emp-password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-confirm">Confirm *</label><input id="emp-confirm" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-company-type">Company Type</label>
                <select id="emp-company-type" value={form.company_type} onChange={(e) => update('company_type', e.target.value)} className="input-field"><option value="">Select</option>{COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-postcode">Postcode</label><input id="emp-postcode" type="text" value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-website">Website</label><input id="emp-website" type="url" value={form.website} onChange={(e) => update('website', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-phone">Phone</label><input id="emp-phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-description">Description</label><textarea id="emp-description" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" /></div>
            <button type="button" onClick={() => setStep(2)} disabled={!form.company_name || !form.email || !form.password} className="btn-primary w-full disabled:opacity-40">Continue</button>
          </div>
        )}

        {/* Step 2: Spa Operations */}
        {step === 2 && (
          <div className="space-y-8">
            <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">Step 2 - Spa Operations</p>
            <CheckboxGroup label="Product Houses Used" options={PRODUCT_HOUSES} selected={form.product_houses_used} onChange={(v) => update('product_houses_used', v)} />
            <CheckboxGroup label="Systems Used" options={SYSTEMS} selected={form.systems_used} onChange={(v) => update('systems_used', v)} columns={2} />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-treatment-rooms">Treatment Rooms</label><input id="emp-treatment-rooms" type="number" value={form.treatment_rooms} onChange={(e) => update('treatment_rooms', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-team-size">Team Size</label><input id="emp-team-size" type="number" value={form.team_size} onChange={(e) => update('team_size', e.target.value)} className="input-field" /></div>
            </div>
            <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button></div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">Step 3 - Verification</p>
            <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-work-email">Work Email (for verification)</label><input id="emp-work-email" type="email" value={form.work_email} onChange={(e) => update('work_email', e.target.value)} className="input-field" placeholder="name@property.com" /></div>
            {/* Terms & Conditions */}
            <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto text-[12px] text-secondary leading-relaxed">
              <p className="font-medium text-ink mb-2">Terms &amp; Conditions - Employer</p>
              <p className="mb-2">By registering a property on WHC Concierge, you agree to the following:</p>
              <p className="mb-2">1. <strong>Accuracy of listings:</strong> All job listings and company information must be accurate and represent genuine vacancies. WHC reserves the right to remove misleading listings.</p>
              <p className="mb-2">2. <strong>Account review:</strong> Employer accounts may be reviewed and approved by WHC before protected Talent or Agency features become available.</p>
              <p className="mb-2">3. <strong>Job posting fees:</strong> Standard Jobs are {JOB_TIERS.Bronze.display} for {JOB_TIERS.Bronze.days} days and Featured Jobs are {JOB_TIERS.Platinum.display} for {JOB_TIERS.Platinum.days} days. Employer Pro currently receives {pounds(EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice)} Standard Jobs and Employer Group currently includes up to {EMPLOYER_MEMBERSHIPS.group.includedJobs} Standard Jobs per membership year. Fees are generally non-refundable once a paid listing is published.</p>
              <p className="mb-2">4. <strong>Agency bookings:</strong> The professional keeps 100% of the agreed shift value. The property pays that agreed value plus a {Math.round(AGENCY_PLATFORM_FEE_PCT * 100)}% WHC platform fee through the Platform. WHC manages the professional payout after the completed shift, subject to any cancellation, dispute or adjustment process.</p>
              <p className="mb-2">5. <strong>Candidate data:</strong> You agree to handle Talent personal data in accordance with applicable data-protection law and our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. Information accessed through the Platform must not be shared with unauthorised third parties.</p>
              <p className="mb-2">6. <strong>Professional conduct:</strong> You agree to treat Talent fairly and professionally. Discriminatory, misleading or abusive practices are prohibited.</p>
              <p className="mb-2">7. <strong>Payments:</strong> Online Platform payments are processed securely through Stripe or another payment provider shown at checkout. You remain responsible for employment salary and compensation terms you advertise unless WHC expressly contracts otherwise.</p>
              <p>8. <strong>Full terms:</strong> Your use of WHC is also subject to the current full Terms of Service linked below.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreed_terms} onChange={(e) => update('agreed_terms', e.target.checked)} className="w-4 h-4 border-border rounded text-ink focus:ring-ink mt-0.5" />
              <span className="text-[13px] text-secondary">I have read and agree to the <Link href="/terms" className="underline text-ink">Terms &amp; Conditions</Link> and <Link href="/privacy" className="underline text-ink">Privacy Policy</Link></span>
            </label>

            <div className="bg-surface p-4 rounded-lg text-[13px] text-secondary">
              Your account will be reviewed by our team within 24 hours. You&apos;ll receive an email once approved.
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={handleSubmit} disabled={loading || !form.agreed_terms} className="btn-primary flex-1 disabled:opacity-40">{loading ? 'Creating account...' : 'Submit for Approval'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
