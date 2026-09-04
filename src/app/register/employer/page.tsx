'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { AGENCY_PLATFORM_FEE_PCT, COMPANY_TYPES, EMPLOYER_MEMBERSHIPS, JOB_TIERS, RECRUITMENT_SERVICE_RATE } from '@/lib/constants'

const pounds = (pence: number) => `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`
const percent = (rate: number) => `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%`

export default function EmployerRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    company_name: '', contact_name: '', work_email: '', website: '',
    company_type: '', agreed_terms: false,
  })

  const update = (field: string, value: any) => { setError(''); setForm(current => ({ ...current, [field]: value })) }

  const handleSubmit = async () => {
    setError('')
    if (!form.company_name.trim()) { setError('Please enter your company or property name.'); return }
    if (!form.contact_name.trim()) { setError('Please enter a contact name.'); return }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setError('Please enter a valid email address.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)

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

    // Spa-operations detail (product houses, systems, treatment rooms, team
    // size) now lives in the employer profile editor after approval - the
    // server sanitiser treats every one of those columns as optional.
    const profileData: Record<string, any> = {
      user_id: init.userId,
      company_name: form.company_name,
      property_name: form.company_name,
      contact_name: form.contact_name,
      contact_email: form.email,
      website: form.website || null,
      company_type: form.company_type || null,
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

  const commercialRows = [
    { label: 'Standard Job', value: `${JOB_TIERS.Bronze.display} for ${JOB_TIERS.Bronze.days} days`, note: 'Talent matching, applications and shortlist included.' },
    { label: 'Featured Job', value: `${JOB_TIERS.Platinum.display} for ${JOB_TIERS.Platinum.days} days`, note: 'Priority placement and a relevant talent email.' },
    { label: 'Employer Pro', value: `Standard Jobs at ${pounds(EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice)}`, note: `${pounds(EMPLOYER_MEMBERSHIPS.pro.price)} a year.` },
    { label: 'Employer Group', value: `${EMPLOYER_MEMBERSHIPS.group.includedJobs} Standard Jobs included`, note: `${pounds(EMPLOYER_MEMBERSHIPS.group.price)} a membership year.` },
    { label: 'Agency cover', value: `${percent(AGENCY_PLATFORM_FEE_PCT)} Talent House fee`, note: 'The professional keeps 100% of the agreed rate; the property pays the rate plus the Talent House fee.' },
    { label: 'Managed recruitment', value: `${percent(RECRUITMENT_SERVICE_RATE)} of first-year salary`, note: 'With a replacement guarantee.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Wordmark />
        <Link href="/login?role=employer" className="text-sm text-muted hover:text-ink">Already registered?</Link>
      </div>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <p className="public-eyebrow">For properties</p>
        <h1 className="mt-3 text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.02em] font-serif font-semibold text-ink max-w-2xl">Register your property</h1>
        <p className="mt-4 text-[14px] leading-7 text-secondary max-w-2xl">One short form, reviewed by our team within 24 hours. Spa details - product houses, systems, treatment rooms - are added to your property profile after approval, not here.</p>

        <div className="mt-12 grid lg:grid-cols-12 gap-12 xl:gap-16">
          {/* The form */}
          <div className="lg:col-span-7">
            {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

            <section aria-labelledby="emp-section-property">
              <p id="emp-section-property" className="border-t border-border pt-4 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">The property</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-company-name">Company / Property Name *</label><input id="emp-company-name" type="text" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} className="input-field" autoComplete="organization" /></div>
                <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-contact-name">Contact Name *</label><input id="emp-contact-name" type="text" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="input-field" autoComplete="name" /></div>
                <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-company-type">Company Type</label>
                  <select id="emp-company-type" value={form.company_type} onChange={(e) => update('company_type', e.target.value)} className="input-field"><option value="">Select</option>{COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-website">Website</label><input id="emp-website" type="url" value={form.website} onChange={(e) => update('website', e.target.value)} className="input-field" autoComplete="url" /></div>
              </div>
            </section>

            <section aria-labelledby="emp-section-account" className="mt-10">
              <p id="emp-section-account" className="border-t border-border pt-4 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">The account</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-email">Email *</label><input id="emp-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" autoComplete="email" /></div>
                <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-password">Password *</label><input id="emp-password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" autoComplete="new-password" /></div>
                <div><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-confirm">Confirm *</label><input id="emp-confirm" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" autoComplete="new-password" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5" htmlFor="emp-work-email">Work Email (for verification)</label><input id="emp-work-email" type="email" value={form.work_email} onChange={(e) => update('work_email', e.target.value)} className="input-field" placeholder="name@property.com" /><p className="mt-1.5 text-[11px] text-muted">An email at your property&apos;s own domain speeds up approval.</p></div>
              </div>
            </section>

            <section aria-labelledby="emp-section-terms" className="mt-10">
              <p id="emp-section-terms" className="border-t border-border pt-4 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">The agreement</p>

              <details className="mt-5 border border-border">
                <summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold text-ink hover:bg-surface">Read the full Terms &amp; Conditions - Employer</summary>
                <div className="border-t border-border px-4 py-4 text-[12px] text-secondary leading-relaxed">
                  <p className="mb-2">By registering a property on Talent House Collective, you agree to the following:</p>
                  <p className="mb-2">1. <strong>Accuracy of listings:</strong> All job listings and company information must be accurate and represent genuine vacancies. Talent House reserves the right to remove misleading listings.</p>
                  <p className="mb-2">2. <strong>Account review:</strong> Employer accounts may be reviewed and approved by Talent House before protected Talent or Agency features become available.</p>
                  <p className="mb-2">3. <strong>Job posting fees:</strong> Standard Jobs are {JOB_TIERS.Bronze.display} for {JOB_TIERS.Bronze.days} days and Featured Jobs are {JOB_TIERS.Platinum.display} for {JOB_TIERS.Platinum.days} days. Employer Pro currently receives {pounds(EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice)} Standard Jobs and Employer Group currently includes up to {EMPLOYER_MEMBERSHIPS.group.includedJobs} Standard Jobs per membership year. Fees are generally non-refundable once a paid listing is published.</p>
                  <p className="mb-2">4. <strong>Agency bookings:</strong> The professional keeps 100% of the agreed shift value. The property pays that agreed value plus a {Math.round(AGENCY_PLATFORM_FEE_PCT * 100)}% Talent House platform fee through the Platform. Talent House manages the professional payout after the completed shift, subject to any cancellation, dispute or adjustment process.</p>
                  <p className="mb-2">5. <strong>Candidate data:</strong> You agree to handle Talent personal data in accordance with applicable data-protection law and our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. Information accessed through the Platform must not be shared with unauthorised third parties.</p>
                  <p className="mb-2">6. <strong>Professional conduct:</strong> You agree to treat Talent fairly and professionally. Discriminatory, misleading or abusive practices are prohibited.</p>
                  <p className="mb-2">7. <strong>Payments:</strong> Online Platform payments are processed securely through Stripe or another payment provider shown at checkout. You remain responsible for employment salary and compensation terms you advertise unless Talent House expressly contracts otherwise.</p>
                  <p>8. <strong>Full terms:</strong> Your use of Talent House is also subject to the current full Terms of Service linked below.</p>
                </div>
              </details>

              <label className="mt-5 flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreed_terms} onChange={(e) => update('agreed_terms', e.target.checked)} className="w-4 h-4 border-border text-ink focus:ring-ink mt-0.5" />
                <span className="text-[13px] text-secondary">I have read and agree to the <Link href="/terms" className="underline text-ink">Terms &amp; Conditions</Link> and <Link href="/privacy" className="underline text-ink">Privacy Policy</Link></span>
              </label>

              <button type="button" onClick={handleSubmit} disabled={loading || !form.agreed_terms} className="btn-primary w-full mt-7 disabled:opacity-40">{loading ? 'Creating account...' : 'Submit for Approval'}</button>
              <p className="mt-4 text-[12px] leading-6 text-muted">Your account will be reviewed by our team within 24 hours. You will receive an email once approved.</p>
            </section>
          </div>

          {/* The commercial intelligence - out of the small print, in plain sight */}
          <aside className="lg:col-span-5" aria-labelledby="emp-charges-heading">
            <div className="bg-[#1c1c1c] p-8 xl:p-10 lg:sticky lg:top-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">In plain sight</p>
              <h2 id="emp-charges-heading" className="mt-3 text-white text-[24px] leading-tight tracking-[-0.02em] font-serif font-semibold">How Talent House charges</h2>
              <p className="mt-3 text-[13px] leading-6 text-white/60">No hidden commercial terms. The numbers below are the same ones written into the agreement you accept on this page.</p>

              <dl className="mt-8">
                {commercialRows.map(row => (
                  <div key={row.label} className="border-t border-white/15 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <dt className="text-[11px] uppercase tracking-[0.14em] text-white/55">{row.label}</dt>
                      <dd className="text-[16px] font-serif font-semibold text-white">{row.value}</dd>
                    </div>
                    <dd className="mt-1 text-[12px] leading-5 text-white/60">{row.note}</dd>
                  </div>
                ))}
                <div className="border-t border-white/15" />
              </dl>

              <p className="mt-6 text-[12px] leading-6 text-white/55">Registration and approval are free. You pay only when you post a role or book cover.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
