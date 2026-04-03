'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const propertyTypes = [
  'Luxury Hotel & Spa', 'Wellness Resort', 'Day Spa', 'Medi-Spa',
  'Thermal Spa', 'Destination Spa', 'Health Club', 'Cruise Line',
  'Private Members Club', 'Beauty Salon', 'Wellness Centre', 'Other'
]

export default function EmployerRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    company_name: '', contact_name: '', phone: '',
    website: '', location: '', property_type: '',
    description: '',
  })

  const update = (field: string, value: string) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'employer', company_name: form.company_name } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Registration failed'); setLoading(false); return }

    const { error: profileError } = await supabase.from('employer_profiles').insert({
      user_id: authData.user.id,
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || null,
      website: form.website || null,
      location: form.location || null,
      property_type: form.property_type || null,
      description: form.description || null,
    })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    router.push('/employer/dashboard')
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">W</span>
            </div>
            <span className="text-white font-serif text-2xl font-semibold">WHC Concierge</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl font-bold text-ink text-center mb-2">Register Your Property</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Access the finest wellness talent in the industry</p>

          <div className="flex items-center justify-center space-x-4 mb-10">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-gold' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="font-serif text-lg font-semibold mb-4">Account & Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name *</label>
                    <input type="text" required value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <input type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                    <input type="password" required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" />
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-serif text-lg font-semibold mb-4">Property Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Property Name *</label>
                  <input type="text" required value={form.company_name} onChange={(e) => update('company_name', e.target.value)} className="input-field" placeholder="e.g. Corinthia London" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
                    <select value={form.property_type} onChange={(e) => update('property_type', e.target.value)} className="input-field">
                      <option value="">Select type</option>
                      {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="London, UK" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">About Your Property</label>
                  <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} className="input-field" placeholder="Tell candidates what makes your property special..." />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already registered? <Link href="/login?role=employer" className="text-gold font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
