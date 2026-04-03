'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const specialisms = [
  'Massage Therapy', 'Beauty Therapy', 'Spa Management', 'Wellness Coaching',
  'Physiotherapy', 'Yoga & Pilates', 'Nutritional Therapy', 'Aesthetic Treatments',
  'Nail Technology', 'Hair Styling', 'Holistic Therapy', 'Fitness Training',
  'Ayurveda', 'Acupuncture', 'Reflexology', 'Aromatherapy'
]

export default function TalentRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', phone: '', location: '',
    headline: '', bio: '', specialisms: [] as string[],
    experience_years: '', salary_min: '', salary_max: '',
    availability: 'immediate',
  })

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  const toggleSpecialism = (s: string) => {
    const current = form.specialisms
    update('specialisms', current.includes(s) ? current.filter(x => x !== s) : [...current, s])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'talent', full_name: form.full_name } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Registration failed'); setLoading(false); return }

    const { error: profileError } = await supabase.from('candidate_profiles').insert({
      user_id: authData.user.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      location: form.location || null,
      headline: form.headline || null,
      bio: form.bio || null,
      specialisms: form.specialisms.length > 0 ? form.specialisms : null,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      availability: form.availability,
    })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    router.push('/talent/dashboard')
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
          <h1 className="font-serif text-2xl font-bold text-ink text-center mb-2">Create Your Talent Profile</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Join the luxury wellness careers community</p>

          {/* Step indicators */}
          <div className="flex items-center justify-center space-x-4 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-gold' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="font-serif text-lg font-semibold mb-4">Account Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input type="text" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="input-field" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder="jane@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <input type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" placeholder="Min 8 characters" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                    <input type="password" required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder="+44..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="London, UK" />
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">Continue</button>
              </div>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-serif text-lg font-semibold mb-4">Professional Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Headline</label>
                  <input type="text" value={form.headline} onChange={(e) => update('headline', e.target.value)} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO Qualified" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                  <textarea rows={4} value={form.bio} onChange={(e) => update('bio', e.target.value)} className="input-field" placeholder="Tell employers about your experience, qualifications and what you're looking for..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Specialisms</label>
                  <div className="flex flex-wrap gap-2">
                    {specialisms.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSpecialism(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          form.specialisms.includes(s) ? 'bg-gold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="font-serif text-lg font-semibold mb-4">Preferences</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                  <input type="number" value={form.experience_years} onChange={(e) => update('experience_years', e.target.value)} className="input-field" placeholder="5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Salary (£)</label>
                    <input type="number" value={form.salary_min} onChange={(e) => update('salary_min', e.target.value)} className="input-field" placeholder="25000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Salary (£)</label>
                    <input type="number" value={form.salary_max} onChange={(e) => update('salary_max', e.target.value)} className="input-field" placeholder="40000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                  <select value={form.availability} onChange={(e) => update('availability', e.target.value)} className="input-field">
                    <option value="immediate">Immediately</option>
                    <option value="2_weeks">2 Weeks Notice</option>
                    <option value="1_month">1 Month Notice</option>
                    <option value="3_months">3 Months Notice</option>
                    <option value="not_looking">Not Currently Looking</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                    {loading ? 'Creating Profile...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account? <Link href="/login?role=talent" className="text-gold font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
